import { NextRequest, NextResponse } from "next/server";
import type { Document } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requestAuth";
import type {
  InteractionAnalyticsSummary,
  InteractionEventRecord,
  InteractionEventType,
  InteractionTopItem,
  InteractionTrendItem,
} from "@/lib/types";

type InteractionEventDocument = {
  _id?: { toString(): string };
  type: InteractionEventType;
  path: string;
  label?: string;
  target?: string;
  userId: string;
  sessionId: string;
  userAgent: string;
  createdAt: Date;
};

type TrendAggregateRow = {
  _id: string;
  events: number;
  users: string[];
};

const COLLECTION_NAME = "analytics_events";

const parseRangeDays = (value: string | null) => {
  const parsed = Number(value || "7");
  if (!Number.isFinite(parsed)) return 7;
  return Math.min(90, Math.max(1, Math.round(parsed)));
};

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (key: string) => {
  const date = new Date(`${key}T00:00:00`);
  if (Number.isNaN(date.getTime())) return key;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const normalizeRecentEvent = (
  doc: InteractionEventDocument
): InteractionEventRecord | null => {
  if (!doc._id) return null;
  return {
    id: doc._id.toString(),
    type: doc.type,
    path: doc.path,
    label: doc.label || "",
    target: doc.target || "",
    userId: doc.userId || "anonymous",
    sessionId: doc.sessionId || "unknown-session",
    createdAt: doc.createdAt?.toISOString?.() || "",
  };
};

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    const { searchParams } = new URL(request.url);
    const rangeDays = parseRangeDays(searchParams.get("days"));

    const now = new Date();
    const since = new Date(now);
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (rangeDays - 1));

    const db = await getDb();
    const collection = db.collection<InteractionEventDocument & Document>(COLLECTION_NAME);

    const totalsAgg = await collection
      .aggregate<{
        totalEvents: number;
        pageViews: number;
        clicks: number;
        formSubmits: number;
        uniqueUsers: string[];
      }>([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: null,
            totalEvents: { $sum: 1 },
            pageViews: {
              $sum: {
                $cond: [{ $eq: ["$type", "page_view"] }, 1, 0],
              },
            },
            clicks: {
              $sum: {
                $cond: [{ $eq: ["$type", "click"] }, 1, 0],
              },
            },
            formSubmits: {
              $sum: {
                $cond: [{ $eq: ["$type", "form_submit"] }, 1, 0],
              },
            },
            uniqueUsers: { $addToSet: "$userId" },
          },
        },
      ])
      .toArray();

    const totalsRow = totalsAgg[0];

    const topPagesAgg = await collection
      .aggregate<{ _id: string; count: number }>([
        {
          $match: {
            createdAt: { $gte: since },
            type: "page_view",
            path: { $type: "string", $ne: "" },
          },
        },
        { $group: { _id: "$path", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ])
      .toArray();

    const topActionsAgg = await collection
      .aggregate<{ _id: string; count: number }>([
        {
          $match: {
            createdAt: { $gte: since },
            type: { $in: ["click", "form_submit"] },
            label: { $type: "string", $ne: "" },
          },
        },
        { $group: { _id: "$label", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ])
      .toArray();

    const trendAgg = await collection
      .aggregate<TrendAggregateRow>([
        {
          $match: {
            createdAt: { $gte: since },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                date: "$createdAt",
                format: "%Y-%m-%d",
              },
            },
            events: { $sum: 1 },
            users: { $addToSet: "$userId" },
          },
        },
      ])
      .toArray();

    const trendLookup = new Map(
      trendAgg.map((item) => [item._id, { events: item.events, users: item.users.length }])
    );

    const trend: InteractionTrendItem[] = [];
    for (let i = rangeDays - 1; i >= 0; i -= 1) {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      const key = formatDateKey(date);
      const bucket = trendLookup.get(key);
      trend.push({
        date: formatDateLabel(key),
        events: bucket?.events || 0,
        users: bucket?.users || 0,
      });
    }

    const recentDocs = await collection
      .find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    const recentEvents = recentDocs
      .map((doc) => normalizeRecentEvent(doc as InteractionEventDocument))
      .filter((item): item is InteractionEventRecord => item !== null);

    const topPages: InteractionTopItem[] = topPagesAgg.map((item) => ({
      label: item._id,
      count: item.count,
    }));

    const topActions: InteractionTopItem[] = topActionsAgg.map((item) => ({
      label: item._id,
      count: item.count,
    }));

    const summary: InteractionAnalyticsSummary = {
      rangeDays,
      totals: {
        totalEvents: totalsRow?.totalEvents || 0,
        uniqueUsers:
          totalsRow?.uniqueUsers?.filter((value) => Boolean(String(value).trim())).length || 0,
        pageViews: totalsRow?.pageViews || 0,
        clicks: totalsRow?.clicks || 0,
        formSubmits: totalsRow?.formSubmits || 0,
      },
      topPages,
      topActions,
      trend,
      recentEvents,
    };

    return NextResponse.json(summary);
  } catch {
    return NextResponse.json(
      { message: "Unable to load interaction analytics" },
      { status: 500 }
    );
  }
}
