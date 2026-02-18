import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { VendorsClient } from "./VendorsClient";

export default async function VendorsPage() {
    const session = await auth();
    if (!session?.user?.id) return redirect("/login");

    const vendors = await prisma.vendor.findMany({
        orderBy: { name: 'asc' }
    });

    return <VendorsClient vendors={vendors} />;
}
