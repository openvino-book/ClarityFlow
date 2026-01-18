import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, PlayCircle, Flag, FileText, Clock } from 'lucide-react';
import { cardApi } from '../lib/api';
import { formatDate, getStatusLabel } from '../lib/utils';
import type { Card as CardType, UpdateCardRequest } from '../types';
import ExportModal from '../components/ExportModal';
import { Button } from '../components/ui';
import { Badge } from '../components/ui';
import { Card, CardContent } from '../components/ui';
import { Input } from '../components/ui';
import { Textarea } from '../components/ui';

export default function CardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Local form state
  const [formData, setFormData] = useState({
    title: '',
    problem: '',
    successCriteria: '',
    outOfScope: '',
    stakeholders: '',
    risks: '',
    dueDate: '',
  });

  // Error states
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Export modal state
  const [exportContent, setExportContent] = useState<string | null>(null);

  // Fetch card detail
  const { data: card, isLoading, error } = useQuery({
    queryKey: ['card', id],
    queryFn: () => cardApi.get(id!),
    enabled: !!id,
    onSuccess: (data) => {
      // Populate form when data loads
      setFormData({
        title: data.title,
        problem: data.problem || '',
        successCriteria: data.successCriteria || '',
        outOfScope: data.outOfScope || '',
        stakeholders: data.stakeholders || '',
        risks: data.risks || '',
        dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateCardRequest) => cardApi.update(id!, data),
    onSuccess: () => {
      // Clear field errors
      setFieldErrors({});
      // Refetch card to get latest version
      queryClient.invalidateQueries({ queryKey: ['card', id] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      alert('保存成功！');
    },
    onError: (err: unknown) => {
      const apiError = err as { response?: { data?: { error?: { message?: string } } } };
      alert(
        `保存失败: ${apiError.response?.data?.error?.message || '未知错误'}`
      );
    },
  });

  // Transition mutation
  const transitionMutation = useMutation({
    mutationFn: (newStatus: string) => cardApi.transition(id!, newStatus),
    onSuccess: () => {
      setTransitionError(null);
      // Refetch card to get latest status and version
      queryClient.invalidateQueries({ queryKey: ['card', id] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      alert('状态已更新！');
    },
    onError: (err: unknown) => {
      const apiError = err as {
        response?: {
          data?: {
            error?: {
              code?: string;
              message?: string;
              details?: { missingFields?: string[]; message?: string };
            };
          };
        };
      };

      const errorData = apiError.response?.data?.error;
      if (errorData?.code === 'CONFLICT' && errorData?.details?.missingFields) {
        // I5: Show missing fields error
        const fields = errorData.details.missingFields;
        const fieldNames: Record<string, string> = {
          problem: '背景与问题',
          successCriteria: '成功标准',
        };
        const missingFieldNames = fields.map((f: string) => fieldNames[f] || f);

        // Set field errors for inline display
        const newFieldErrors: Record<string, string> = {};
        fields.forEach((field: string) => {
          newFieldErrors[field] = '必填字段';
        });
        setFieldErrors(newFieldErrors);

        setTransitionError(`无法推进状态，以下字段缺失：${missingFieldNames.join('、')}`);
      } else {
        setTransitionError(errorData?.message || '状态流转失败');
      }
    },
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: () => cardApi.export(id!),
    onSuccess: (markdown) => {
      setExportContent(markdown);
    },
    onError: (err: unknown) => {
      const apiError = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      alert(`导出失败: ${apiError.response?.data?.error?.message || '未知错误'}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">
          加载失败: {(error as Error)?.message || '卡片不存在'}
        </p>
        <Link to="/" className="text-blue-600 hover:underline mt-2 inline-block">
          返回列表
        </Link>
      </div>
    );
  }

  const isDone = card.status === 'DONE';
  const isReadOnly = isDone;

  // Determine transition options
  const transitions: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
    NEEDS_CLARIFICATION: {
      label: '确认任务',
      icon: CheckCircle,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    CONFIRMED: {
      label: '开始执行',
      icon: PlayCircle,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    IN_PROGRESS: {
      label: '标记完成',
      icon: Flag,
      color: 'bg-green-600 hover:bg-green-700',
    },
    DONE: {
      label: '已完成',
      icon: CheckCircle,
      color: 'bg-gray-400 cursor-not-allowed',
    },
  };

  const transition = transitions[card.status];
  const TransitionIcon = transition.icon;
  const canTransition = card.status !== 'DONE';

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransitionError(null);
    setFieldErrors({}); // Clear field errors on save

    updateMutation.mutate({
      version: card.version,
      title: formData.title,
      problem: formData.problem || undefined,
      successCriteria: formData.successCriteria || undefined,
      outOfScope: formData.outOfScope || undefined,
      stakeholders: formData.stakeholders || undefined,
      risks: formData.risks || undefined,
      dueDate: formData.dueDate || undefined,
    });
  };

  // Handle transition
  const handleTransition = () => {
    if (!canTransition) return;

    setTransitionError(null);
    setFieldErrors({});

    const nextStatus: Record<string, string> = {
      NEEDS_CLARIFICATION: 'CONFIRMED',
      CONFIRMED: 'IN_PROGRESS',
      IN_PROGRESS: 'DONE',
    };

    transitionMutation.mutate(nextStatus[card.status]);
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        {/* Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回看板
        </Link>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {formData.title}
        </h1>

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-6">
          <Badge status={card.status}>{getStatusLabel(card.status)}</Badge>
          <span>•</span>
          <span>版本 {card.version}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            更新于 {formatDate(card.updatedAt)}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-200">
          <div className="text-sm text-gray-500">
            {isReadOnly ? (
              <span>此任务已完成，字段为只读状态</span>
            ) : (
              <span>编辑项目文档并推进任务状态</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Export Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportMutation.mutate()}
              isLoading={exportMutation.isPending}
            >
              <FileText className="w-4 h-4" />
              Export
            </Button>

            {/* Transition Button */}
            {canTransition && (
              <Button
                variant={card.status === 'NEEDS_CLARIFICATION' ? 'primary' : 'secondary'}
                size="sm"
                onClick={handleTransition}
                disabled={transitionMutation.isPending}
              >
                <TransitionIcon className="w-4 h-4" />
                {transition.label}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Transition Error Display */}
      {transitionError && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-sm font-medium text-red-800">状态流转失败</p>
          <p className="text-sm text-red-700 mt-1">{transitionError}</p>
        </div>
      )}

      {/* Form Card */}
      <Card>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                任务标题 <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={isReadOnly}
                placeholder="例如：实现用户登录功能"
                maxLength={120}
              />
            </div>

            {/* Problem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                背景与问题 (Problem) <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={formData.problem}
                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                disabled={isReadOnly}
                rows={5}
                placeholder="描述当前需要解决的问题或背景..."
                error={fieldErrors.problem}
              />
              {fieldErrors.problem && (
                <p className="text-sm text-red-600 mt-1">{fieldErrors.problem}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                详细说明任务的背景、当前问题或机会点
              </p>
            </div>

            {/* Success Criteria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                成功标准 (Definition of Done) <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={formData.successCriteria}
                onChange={(e) =>
                  setFormData({ ...formData, successCriteria: e.target.value })
                }
                disabled={isReadOnly}
                rows={5}
                placeholder="定义如何判断任务已完成..."
                error={fieldErrors.successCriteria}
              />
              {fieldErrors.successCriteria && (
                <p className="text-sm text-red-600 mt-1">{fieldErrors.successCriteria}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                明确的验收标准，用于判断任务是否完成
              </p>
            </div>

            {/* Out of Scope */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                边界 (Out of Scope)
              </label>
              <Textarea
                value={formData.outOfScope}
                onChange={(e) =>
                  setFormData({ ...formData, outOfScope: e.target.value })
                }
                disabled={isReadOnly}
                rows={3}
                placeholder="明确哪些内容不在本次任务范围内..."
              />
              <p className="text-xs text-gray-500 mt-1">
                明确排除的内容，防止范围蔓延（可选）
              </p>
            </div>

            {/* Stakeholders */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                关键人 (Stakeholders)
              </label>
              <Input
                type="text"
                value={formData.stakeholders}
                onChange={(e) =>
                  setFormData({ ...formData, stakeholders: e.target.value })
                }
                disabled={isReadOnly}
                placeholder="例如：产品团队、安全团队、前端开发组"
              />
              <p className="text-xs text-gray-500 mt-1">
                涉及的团队或个人（可选）
              </p>
            </div>

            {/* Risks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                风险 (Risks)
              </label>
              <Textarea
                value={formData.risks}
                onChange={(e) => setFormData({ ...formData, risks: e.target.value })}
                disabled={isReadOnly}
                rows={3}
                placeholder="可能遇到的风险或挑战..."
              />
              <p className="text-xs text-gray-500 mt-1">
                可能影响任务成功的因素（可选）
              </p>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                截止日期 (Due Date)
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                disabled={isReadOnly}
              />
            </div>

            {/* Submit Actions */}
            {!isReadOnly && (
              <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={updateMutation.isPending}
                  disabled={updateMutation.isPending}
                >
                  <Save className="w-4 h-4" />
                  保存更改
                </Button>
                <Link to="/">
                  <Button variant="ghost" size="md">
                    取消
                  </Button>
                </Link>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Export Modal */}
      {exportContent && (
        <ExportModal
          content={exportContent}
          onClose={() => setExportContent(null)}
        />
      )}
    </div>
  );
}
