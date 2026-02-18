import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get unread count
        const { searchParams } = new URL(req.url);
        const countOnly = searchParams.get("countOnly") === "true";

        if (countOnly) {
            const unreadCount = await prisma.notification.count({
                where: {
                    userId: user.id,
                    isRead: false,
                },
            });
            return NextResponse.json({ count: unreadCount });
        }

        // Get all notifications (last 50)
        const notifications = await prisma.notification.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 50,
        });

        const unreadCount = notifications.filter(n => !n.isRead).length;

        return NextResponse.json({
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error("Get notifications error:", error);
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}

// Mark notification as read
export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { notificationId, markAllRead } = await req.json();

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (markAllRead) {
            // Mark all as read
            await prisma.notification.updateMany({
                where: {
                    userId: user.id,
                    isRead: false,
                },
                data: {
                    isRead: true,
                },
            });
            return NextResponse.json({ message: "All notifications marked as read" });
        }

        if (notificationId) {
            // Mark single notification as read
            await prisma.notification.update({
                where: {
                    id: notificationId,
                    userId: user.id, // Ensure user owns this notification
                },
                data: {
                    isRead: true,
                },
            });
            return NextResponse.json({ message: "Notification marked as read" });
        }

        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    } catch (error) {
        console.error("Update notification error:", error);
        return NextResponse.json(
            { error: "Failed to update notification" },
            { status: 500 }
        );
    }
}
