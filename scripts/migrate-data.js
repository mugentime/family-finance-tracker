// Data migration script from localStorage to PostgreSQL
// This script helps users migrate their existing localStorage data to the new database

import { DatabaseService, MembersService, CategoriesService, TransactionsService, ProductsService } from '../services/databaseService.js';

const migrateLocalStorageData = async () => {
  console.log('🔄 Starting data migration from localStorage to PostgreSQL...');

  try {
    // Initialize database first
    await DatabaseService.initializeData();
    console.log('✅ Database initialized');

    // Note: This script is designed to run in a browser context where localStorage is available
    // For actual migration, users would need to:
    // 1. Export their localStorage data from the browser
    // 2. Import it into this script
    // 3. Run the migration

    console.log('📋 Migration Instructions:');
    console.log('1. Open your browser with the old localStorage data');
    console.log('2. Open Developer Tools (F12) → Console');
    console.log('3. Run the following commands to export your data:');
    console.log('');
    console.log('// Export localStorage data');
    console.log('const exportData = {');
    console.log('  members: JSON.parse(localStorage.getItem("members") || "[]"),');
    console.log('  categories: JSON.parse(localStorage.getItem("categories") || "[]"),');
    console.log('  transactions: JSON.parse(localStorage.getItem("transactions") || "[]"),');
    console.log('  products: JSON.parse(localStorage.getItem("products") || "[]"),');
    console.log('  budgets: JSON.parse(localStorage.getItem("budgets") || "[]"),');
    console.log('  orders: JSON.parse(localStorage.getItem("orders") || "[]"),');
    console.log('  expenses: JSON.parse(localStorage.getItem("expenses") || "[]"),');
    console.log('  cashSessions: JSON.parse(localStorage.getItem("cashSessions") || "[]"),');
    console.log('  coworkingSessions: JSON.parse(localStorage.getItem("coworkingSessions") || "[]")');
    console.log('};');
    console.log('console.log("Copy this data:", JSON.stringify(exportData, null, 2));');
    console.log('');
    console.log('4. Copy the exported data');
    console.log('5. Paste it into the importData.json file');
    console.log('6. Run: npm run migrate-data');

    // Example migration function (would need actual data)
    const migrateData = async (localStorageData) => {
      let migrationStats = {
        members: 0,
        categories: 0,
        transactions: 0,
        products: 0,
        total: 0
      };

      // Migrate members (excluding defaults)
      if (localStorageData.members && localStorageData.members.length > 1) {
        for (const member of localStorageData.members) {
          if (member.username !== 'Admin') { // Skip default admin
            try {
              await MembersService.create({
                username: member.username,
                email: member.email,
                password: member.password || 'defaultPassword',
                role: member.role || 'member',
                status: member.status || 'approved',
                telegramId: member.telegramId
              });
              migrationStats.members++;
            } catch (error) {
              console.log(`⚠️  Skipped member ${member.username}: ${error.message}`);
            }
          }
        }
      }

      // Migrate custom categories
      if (localStorageData.categories) {
        const defaultCategoryNames = [
          'Alimentos', 'Vivienda', 'Transporte', 'Servicios',
          'Entretenimiento', 'Salud', 'Educación', 'Otro',
          'Salario', 'Bonos', 'Inversiones'
        ];

        for (const category of localStorageData.categories) {
          if (!defaultCategoryNames.includes(category.name)) {
            try {
              await CategoriesService.create({
                name: category.name,
                type: category.type,
                icon: category.icon
              });
              migrationStats.categories++;
            } catch (error) {
              console.log(`⚠️  Skipped category ${category.name}: ${error.message}`);
            }
          }
        }
      }

      // Migrate transactions
      if (localStorageData.transactions) {
        for (const transaction of localStorageData.transactions) {
          try {
            await TransactionsService.create({
              date: transaction.date,
              description: transaction.description,
              amount: transaction.amount,
              type: transaction.type,
              categoryId: transaction.categoryId,
              memberId: transaction.memberId
            });
            migrationStats.transactions++;
          } catch (error) {
            console.log(`⚠️  Skipped transaction: ${error.message}`);
          }
        }
      }

      // Migrate products
      if (localStorageData.products) {
        for (const product of localStorageData.products) {
          try {
            await ProductsService.create({
              name: product.name,
              price: product.price,
              cost: product.cost,
              stock: product.stock,
              description: product.description || '',
              imageUrl: product.imageUrl || '',
              category: product.category
            });
            migrationStats.products++;
          } catch (error) {
            console.log(`⚠️  Skipped product ${product.name}: ${error.message}`);
          }
        }
      }

      migrationStats.total = migrationStats.members + migrationStats.categories +
                            migrationStats.transactions + migrationStats.products;

      return migrationStats;
    };

    // Check if migration data file exists
    try {
      const fs = await import('fs');
      const migrationData = JSON.parse(fs.readFileSync('./importData.json', 'utf8'));
      console.log('📦 Found migration data, starting migration...');

      const stats = await migrateData(migrationData);

      console.log('🎉 Migration completed!');
      console.log(`📊 Migration Summary:`);
      console.log(`   • Members: ${stats.members}`);
      console.log(`   • Categories: ${stats.categories}`);
      console.log(`   • Transactions: ${stats.transactions}`);
      console.log(`   • Products: ${stats.products}`);
      console.log(`   • Total items: ${stats.total}`);

    } catch (fileError) {
      console.log('📄 No importData.json found. Please follow the export instructions above.');
      console.log('💡 After exporting, create importData.json with your localStorage data and run this script again.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateLocalStorageData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

export { migrateLocalStorageData };