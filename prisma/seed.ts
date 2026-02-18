import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database with East African context...')

    // Cleanup existing data for clean demo
    await prisma.invoiceLineItem.deleteMany({})
    await prisma.saleItem.deleteMany({})

    await prisma.expense.deleteMany({})
    await prisma.requisition.deleteMany({})
    await prisma.walletTransaction.deleteMany({})

    // AR Cleanup
    await prisma.customerPayment.deleteMany({})
    await prisma.sale.deleteMany({})
    await prisma.customer.deleteMany({})

    // AP Cleanup
    await prisma.invoice.deleteMany({}) // Vendor Invoices
    await prisma.payment.deleteMany({}) // Vendor Payments
    await prisma.vendor.deleteMany({})

    await prisma.wallet.deleteMany({})
    await prisma.wallet.deleteMany({})
    await prisma.user.deleteMany({})

    // GL Cleanup
    await prisma.journalLine.deleteMany({})
    await prisma.journalEntry.deleteMany({})
    await prisma.account.deleteMany({})

    // Create admin user (Kenyan HQ context)
    const adminPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.create({
        data: {
            email: 'admin@payridge.co.ke',
            name: 'System Administrator',
            password: adminPassword,
            role: 'SYSTEM_ADMIN',
            department: 'IT',
            position: 'Head of IT',
            isActive: true,
            accountStatus: 'ACTIVE',
        },
    })

    // Create finance user (South Sudan Ops)
    const financePassword = await bcrypt.hash('finance123', 10)
    const finance = await prisma.user.create({
        data: {
            email: 'chol@payridge.ss',
            name: 'Chol Deng',
            password: financePassword,
            role: 'FINANCE_APPROVER',
            department: 'Finance',
            position: 'Finance Manager',
            isActive: true,
            accountStatus: 'ACTIVE',
        },
    })

    // Create manager (Nairobi Sales)
    const managerPassword = await bcrypt.hash('manager123', 10)
    const manager = await prisma.user.create({
        data: {
            email: 'wanjiku@payridge.co.ke',
            name: 'Wanjiku Kimani',
            password: managerPassword,
            role: 'MANAGER',
            department: 'Sales',
            position: 'Canal Sales Lead',
            isActive: true,
            accountStatus: 'ACTIVE',
        },
    })

    // Create employee (Field Rep in Juba)
    const employeePassword = await bcrypt.hash('employee123', 10)
    const employee = await prisma.user.create({
        data: {
            email: 'juma@payridge.ss',
            name: 'Juma Alier',
            password: employeePassword,
            role: 'EMPLOYEE',
            department: 'Sales',
            position: 'Field Representative',
            managerId: manager.id,
            bankAccount: 'USD-88293-Equity',
            phoneNumber: '+211 920 123 456',
            isActive: true,
            accountStatus: 'ACTIVE',
        },
    })

    // Create wallets (Clean slate)
    await prisma.wallet.create({ data: { userId: admin.id, balance: 0.00, currency: 'USD' } })
    await prisma.wallet.create({ data: { userId: finance.id, balance: 0.00, currency: 'USD' } })
    await prisma.wallet.create({ data: { userId: manager.id, balance: 0.00, currency: 'USD' } })
    const employeeWallet = await prisma.wallet.create({
        data: { userId: employee.id, balance: 0.00, currency: 'USD' }
    })

    // Wallet Transactions
    // DELETED SEED DATA

    // ============================================================================
    // RBAC: PERMISSIONS & ROLES
    // ============================================================================
    console.log('Seeding RBAC System...')

    // 1. Define All Permissions
    const permissionsList = [
        // User Management
        { resource: 'USERS', action: 'VIEW', description: 'View user list' },
        { resource: 'USERS', action: 'CREATE', description: 'Create new users' },
        { resource: 'USERS', action: 'EDIT', description: 'Edit user details' },
        { resource: 'USERS', action: 'DELETE', description: 'Deactivate users' },

        // Roles
        { resource: 'ROLES', action: 'MANAGE', description: 'Manage roles and permissions' },

        // Finance & Accounting
        { resource: 'GL', action: 'VIEW', description: 'View General Ledger' },
        { resource: 'GL', action: 'MANAGE', description: 'Manage Chart of Accounts and Journal Entries' },
        { resource: 'INVOICES', action: 'VIEW', description: 'View Vendor Invoices' },
        { resource: 'INVOICES', action: 'CREATE', description: 'Create/Upload Vendor Invoices' },
        { resource: 'INVOICES', action: 'APPROVE', description: 'Approve Vendor Invoices' },
        { resource: 'PAYMENTS', action: 'create', description: 'Initiate Payments' },
        { resource: 'PAYMENTS', action: 'approve', description: 'Approve Payments' },

        // Sales
        { resource: 'CUSTOMERS', action: 'MANAGE', description: 'Manage Customers' },
        { resource: 'SALES', action: 'MANAGE', description: 'Create and Send Invoices to Customers' },

        // Expenses
        { resource: 'EXPENSES', action: 'VIEW_ALL', description: 'View all company expenses' },
        { resource: 'EXPENSES', action: 'APPROVE', description: 'Approve team expenses' },
        { resource: 'REQUISITIONS', action: 'APPROVE', description: 'Approve requisition requests' },

        // System
        { resource: 'SETTINGS', action: 'MANAGE', description: 'Manage system settings' },
        { resource: 'AUDIT', action: 'VIEW', description: 'View audit logs' },
    ]

    const createdPermissions: Record<string, string> = {} // Map: resource_action -> id

    for (const p of permissionsList) {
        const perm = await prisma.permission.upsert({
            where: {
                resource_action: {
                    resource: p.resource,
                    action: p.action
                }
            },
            update: {},
            create: p
        })
        createdPermissions[`${p.resource}_${p.action}`] = perm.id
    }

    // 2. Define Default Roles
    const rolesList = [
        {
            name: 'System Administrator',
            description: 'Full access to all system features',
            isSystem: true,
            permissions: Object.keys(createdPermissions) // All permissions
        },
        {
            name: 'Finance Manager',
            description: 'Oversees all financial operations, approvals, and reporting',
            isSystem: true,
            permissions: [
                'GL_VIEW', 'GL_MANAGE',
                'INVOICES_VIEW', 'INVOICES_CREATE', 'INVOICES_APPROVE',
                'PAYMENTS_create', 'PAYMENTS_approve',
                'CUSTOMERS_MANAGE', 'SALES_MANAGE',
                'EXPENSES_VIEW_ALL', 'EXPENSES_APPROVE', 'REQUISITIONS_APPROVE',
                'USERS_VIEW', 'AUDIT_VIEW'
            ]
        },
        {
            name: 'Accountant',
            description: 'Day-to-day accounting, bookkeeping, and invoice processing',
            isSystem: false,
            permissions: [
                'GL_VIEW',
                'INVOICES_VIEW', 'INVOICES_CREATE',
                'CUSTOMERS_MANAGE', 'SALES_MANAGE',
                'EXPENSES_VIEW_ALL'
            ]
        },
        {
            name: 'Employee',
            description: 'Standard access for expense submission and personal tasks',
            isSystem: true,
            permissions: [] // Basic access is implied/not gated by special permissions
        }
    ]

    for (const r of rolesList) {
        // Create Role
        const role = await prisma.role.upsert({
            where: { name: r.name },
            update: {},
            create: {
                name: r.name,
                description: r.description,
                isSystem: r.isSystem
            }
        })

        // Assign Permissions
        if (r.permissions.length > 0) {
            // First clear existing to avoid duplicates on re-seed
            await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })

            const data = r.permissions
                .map(key => ({
                    roleId: role.id,
                    permissionId: createdPermissions[key]
                }))
                .filter(item => item.permissionId) // Ensure ID exists

            if (data.length > 0) {
                await prisma.rolePermission.createMany({ data })
            }
        }
    }

    // ============================================================================
    // CHART OF ACCOUNTS (GENERAL LEDGER)
    // ============================================================================
    console.log('Creating Chart of Accounts...')

    // 1. Assets
    await prisma.account.create({
        data: {
            code: '1000',
            name: 'Cash & Bank',
            type: 'ASSET',
            subtype: 'CURRENT_ASSET',
            description: 'Main operating bank account'
        }
    })

    await prisma.account.create({
        data: {
            code: '1200',
            name: 'Accounts Receivable',
            type: 'ASSET',
            subtype: 'CURRENT_ASSET',
            description: 'Money owed by customers'
        }
    })

    // 2. Liabilities
    await prisma.account.create({
        data: {
            code: '2000',
            name: 'Accounts Payable',
            type: 'LIABILITY',
            subtype: 'CURRENT_LIABILITY',
            description: 'Money owed to vendors'
        }
    })

    // 3. Equity
    await prisma.account.create({
        data: {
            code: '3000',
            name: 'Retained Earnings',
            type: 'EQUITY',
            description: 'Accumulated profits/losses'
        }
    })

    // 4. Revenue
    await prisma.account.create({
        data: {
            code: '4000',
            name: 'Sales Revenue',
            type: 'REVENUE',
            description: 'Income from sales'
        }
    })

    await prisma.account.create({
        data: {
            code: '4100',
            name: 'Sales Returns',
            type: 'REVENUE',
            subtype: 'CONTRA_REVENUE',
            description: 'Refunds and returns'
        }
    })

    // 5. Expenses
    await prisma.account.create({
        data: {
            code: '6000',
            name: 'Operating Expenses',
            type: 'EXPENSE',
            description: 'General operating expenses'
        }
    })

    // Categories
    const categories = [
        { name: 'Travel', description: 'Flights, Visa fees, Airport transfers' },
        { name: 'Accommodation', description: 'Hotels and guesthouses' },
        { name: 'Meals & Entertainment', description: 'Client dinners, per diem' },
        { name: 'Logistics', description: 'Courier, freight, transport' },
        { name: 'Communication', description: 'Airtime, Internet bundles' },
        { name: 'Permits & Licenses', description: 'Government levies and permits' },
    ]

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { name: cat.name },
            update: {},
            create: cat,
        })
    }

    // Requisitions
    await prisma.requisition.create({
        data: {
            userId: employee.id,
            title: 'Q1 South Sudan Market Activation',
            description: 'Roadshow materials and logistics for Juba/Nimule corridor',
            amount: 5000.00,
            currency: 'USD',
            category: 'Logistics',
            businessJustification: 'Expand market share in Equatoria region',
            status: 'PENDING',
        },
    })

    // Expenses
    // DELETED SEED DATA

    // 2. Hotel
    // DELETED SEED DATA

    // 3. Dinner
    // DELETED SEED DATA

    // 4. Internet
    // DELETED SEED DATA

    // Vendors
    await prisma.vendor.create({
        data: {
            name: 'Kenya Airways',
            legalName: 'Kenya Airways Ltd',
            category: 'Travel',
            isPreferred: true,
            isActive: true,
        },
    })

    await prisma.vendor.create({
        data: {
            name: 'Pyramid Continental',
            legalName: 'Pyramid Hotels Group',
            category: 'Accommodation',
            isPreferred: true,
            isActive: true,
        },
    })

    // Customers (East Africa)
    console.log('Creating Regional Customers...')

    // Customers (East Africa)
    console.log('Skipping Customer creation to allow clean slate.')
    // DELETED SEED DATA: KCB Group, WFP, Sales, Payments.


    console.log('✅ East African Context Seeded Successfully!')
    console.log('\n📧 New Regional Test Accounts:')
    console.log('Admin (KE): admin@payridge.co.ke / admin123')
    console.log('Finance (SS): chol@payridge.ss / finance123')
    console.log('Manager (KE): wanjiku@payridge.co.ke / manager123')
    console.log('Employee (SS): juma@payridge.ss / employee123')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
