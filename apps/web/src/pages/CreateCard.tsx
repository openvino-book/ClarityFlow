import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { cardApi } from '../lib/api';

export default function CreateCard() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Create card mutation
  const createMutation = useMutation({
    mutationFn: (data: { title: string }) => cardApi.create(data),
    onSuccess: (newCard) => {
      // Immediately navigate to the detail page for clarification
      navigate(`/cards/${newCard.id}`, { replace: true });
    },
    onError: (err: unknown) => {
      const apiError = err as {
        response?: { data?: { error?: { message?: string; details?: unknown } } };
      };
      const errorMessage =
        apiError.response?.data?.error?.message || '创建失败，请重试';
      setError(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Trim and validate
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('请输入卡片标题');
      return;
    }

    if (trimmedTitle.length > 120) {
      setError('标题不能超过120个字符');
      return;
    }

    createMutation.mutate({ title: trimmedTitle });
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">创建新任务</h1>
        <p className="text-gray-600 mt-1">
          快速创建任务卡片，然后在详情页中逐步澄清
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              任务标题 <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={createMutation.isPending}
              placeholder="例如：实现用户登录功能"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
              maxLength={120}
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                简明扼要地描述任务内容
              </p>
              <p className="text-xs text-gray-400">
                {title.length}/120
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={createMutation.isPending || !title.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base shadow-sm"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create & Clarify
                </>
              )}
            </button>
            <Link
              to="/"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-base"
            >
              取消
            </Link>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 提示：</strong>创建后会自动跳转到详情页，您可以：
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
            <li>填写详细的背景和成功标准</li>
            <li>添加关键人和风险评估</li>
            <li>确认后将任务推进到"已确认"状态</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
