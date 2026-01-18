import { getPrismaClient } from './src/lib/prisma';

const prisma = getPrismaClient();

async function createTestData() {
  // Clear existing cards
  await prisma.card.deleteMany();

  // Create test cards
  await prisma.card.createMany({
    data: [
      {
        title: '实现用户登录功能',
        problem: '用户无法登录系统',
        successCriteria: '用户可以使用邮箱密码登录',
        outOfScope: null,
        stakeholders: null,
        risks: '存在安全隐患，需要加密存储',
        status: 'NEEDS_CLARIFICATION',
        version: 0,
      },
      {
        title: '优化数据库查询性能',
        problem: '列表页加载缓慢，影响用户体验',
        successCriteria: '响应时间小于200ms，支持10000+数据',
        outOfScope: '缓存层优化',
        stakeholders: '后端团队',
        risks: null,
        status: 'CONFIRMED',
        version: 1,
      },
      {
        title: '添加导出PDF功能',
        problem: '用户需要导出报告为PDF格式',
        successCriteria: '支持一键导出，格式保持一致',
        outOfScope: null,
        stakeholders: null,
        risks: 'PDF格式兼容性问题',
        status: 'IN_PROGRESS',
        version: 2,
        dueDate: new Date('2025-02-01'),
      },
      {
        title: '修复移动端显示问题',
        problem: '手机上布局错乱，影响使用',
        successCriteria: '在iOS和Android上正常显示',
        outOfScope: null,
        stakeholders: '前端团队，测试团队',
        risks: null,
        status: 'DONE',
        version: 3,
      },
    ],
  });

  console.log('Created 4 test cards');

  await prisma.$disconnect();
}

createTestData().catch(console.error);
