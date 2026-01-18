import { getPrismaClient } from './src/lib/prisma';
import { generateMarkdownExport } from './src/routes';

const prisma = getPrismaClient();

async function testExport() {
  const card = await prisma.card.create({
    data: {
      title: '实现用户认证功能',
      problem: '用户无法登录系统，需要实现安全的身份验证机制',
      successCriteria: '用户可以使用邮箱和密码登录\n支持密码重置\n会话保持30天',
      outOfScope: '第三方社交登录集成\n多因素认证（MFA）',
      stakeholders: '产品团队、安全团队、前端开发组',
      risks: '密码存储不安全可能导致数据泄露\nDDoS攻击可能影响认证服务',
      status: 'CONFIRMED',
      version: 2,
    },
  });

  const markdown = generateMarkdownExport(card);
  console.log('=== Generated Markdown Export ===\n');
  console.log(markdown);
  console.log('\n=== End of Export ===\n');

  await prisma.card.deleteMany();
  await prisma.$disconnect();
}

testExport().catch(console.error);
