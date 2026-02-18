
import { getAssets, getAssetStats } from "./actions";
import { AssetManager } from "./AssetManager";
import { auth } from "@/auth"; // import auth
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic'; // Prevent static prerendering

export const metadata = {
    title: "Asset Management | Prudence",
    description: "Track and manage company assets",
};

export default async function AssetsPage({ searchParams }: { searchParams: { q?: string } }) {
    const session = await auth(); // Ensure authenticated
    if (!session?.user) return redirect("/login");

    const query = searchParams?.q || "";
    const { data: assets } = await getAssets(query);
    const stats = await getAssetStats();

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 min-h-screen bg-gray-50/50">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Asset Management</h1>
                <p className="text-gray-500">Track, manage and optimize your company's physical assets.</p>
            </div>

            <AssetManager assets={assets || []} stats={stats} />
        </div>
    );
}
