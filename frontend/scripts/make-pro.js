const postgres = require('postgres');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const postgresUrl = process.argv[2] || process.env.POSTGRES_URL;

if (!postgresUrl || postgresUrl.includes('***')) {
  console.error('❌ Database connection URL is missing or masked.');
  console.error('👉 Please run the script by passing your database URL as an argument:');
  console.error('   node scripts/make-pro.js "postgresql://postgres:YOUR_PASSWORD@reseau.proxy.rlwy.net:49478/railway"');
  process.exit(1);
}

console.log('🔌 Connecting to PostgreSQL database...');
const sql = postgres(postgresUrl, { ssl: 'require' });

async function run() {
  try {
    const email = 'abubokkor.cse@gmail.com';
    
    // Find the user
    const users = await sql`
      SELECT id, name, email FROM users WHERE email = ${email}
    `;
    
    if (users.length === 0) {
      console.log(`❌ User not found with email: ${email}`);
      console.log('Register the user through the UI first, or run a insert statement.');
      process.exit(1);
    }
    
    const user = users[0];
    console.log(`👤 Found user: ${user.name} (${user.email}), ID: ${user.id}`);
    
    // Find the team members entry
    const members = await sql`
      SELECT team_id, role FROM team_members WHERE user_id = ${user.id}
    `;
    
    if (members.length === 0) {
      console.log('❌ User is not part of any team. Creating team first...');
      
      const teamName = `${email}'s Team`;
      const newTeams = await sql`
        INSERT INTO teams (name, plan_name, subscription_status, paddle_customer_id, paddle_subscription_id, paddle_price_id, created_at, updated_at)
        VALUES (${teamName}, 'Pro Annual', 'active', 'cus_manual_pro', 'sub_manual_pro_1y', 'pri_annual', NOW(), NOW())
        RETURNING id
      `;
      
      const teamId = newTeams[0].id;
      console.log(`🎉 Created team with ID: ${teamId}`);
      
      await sql`
        INSERT INTO team_members (user_id, team_id, role, joined_at)
        VALUES (${user.id}, ${teamId}, 'owner', NOW())
      `;
      console.log(`✅ Linked user to team as owner`);
    } else {
      const teamId = members[0].team_id;
      console.log(`👥 Found user's team ID: ${teamId}. Upgrading plan...`);
      
      await sql`
        UPDATE teams 
        SET plan_name = 'Pro Annual', 
            subscription_status = 'active', 
            paddle_customer_id = 'cus_manual_pro', 
            paddle_subscription_id = 'sub_manual_pro_1y', 
            paddle_price_id = 'pri_annual',
            updated_at = NOW() 
        WHERE id = ${teamId}
      `;
      console.log(`✅ Updated team subscription info for team ID: ${teamId}`);
    }
    
    // Log final state to verify
    const checkTeam = await sql`
      SELECT t.id, t.name, t.plan_name, t.subscription_status 
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ${user.id}
    `;
    console.log('📊 Verification result:', checkTeam[0]);
    console.log('🌟 Successfully upgraded user to Pro Annual (1 year)!');
    
  } catch (err) {
    console.error('❌ Error updating database:', err);
  } finally {
    await sql.end();
  }
}

run();
