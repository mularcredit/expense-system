export const EXPENSE_CATEGORIES = [
    "Operations",
    "Salaries & Wages",
    "Travel & Transport",
    "Meals & Hospitality",
    "Per Diem / Allowance",
    "Casual Labor",
    "Utilities (Water, Power)",
    "Rent / Premises",
    "Office Supplies",
    "Medical & Welfare",
    "Vehicle Maintenance",
    "Security Services",
    "Permits & Licenses",
    "Marketing & Branding",
    "Software & Subscriptions",
    "Equipment & Repairs",
    "Professional Services",
    "Bank Charges",
    "Other"
];

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

// This will be used to get all categories including custom ones
export async function getAllCategories() {
    const prisma = (await import("@/lib/prisma")).default;

    try {
        const customCategories = await (prisma as any).customCategory.findMany({
            where: { isActive: true },
            select: { name: true },
            orderBy: { name: "asc" },
        });

        const customCategoryNames = customCategories.map((c: any) => c.name);

        // Merge built-in and custom categories, removing duplicates
        const allCategories = [...EXPENSE_CATEGORIES, ...customCategoryNames];
        return Array.from(new Set(allCategories));
    } catch (error) {
        console.error("Error fetching custom categories:", error);
        return EXPENSE_CATEGORIES;
    }
}

