// lib/styles.ts — 统一样式常量，所有组件从这里取，不硬编码颜色

export const styles = {
  page: 'min-h-screen bg-background px-5 py-6 max-w-md mx-auto',

  card: 'bg-surface rounded-card shadow-card border border-border p-4',

  bubbleAI:   'bg-surface border border-border rounded-[4px_14px_14px_14px] px-4 py-3 text-[14px] leading-[1.8] text-text-primary shadow-card max-w-[85%]',
  bubbleUser: 'bg-[rgba(139,115,85,0.08)] border border-[rgba(139,115,85,0.25)] rounded-[14px_4px_14px_14px] px-4 py-3 text-[14px] leading-[1.8] text-text-primary ml-auto max-w-[85%]',

  btnPrimary:   'bg-primary text-white rounded-btn px-4 py-2.5 text-[13px] font-medium shadow-btn hover:bg-primary-dark transition-colors active:scale-95',
  btnSecondary: 'bg-surface border border-border text-text-primary rounded-btn px-4 py-2.5 text-[13px] hover:bg-surface-2 transition-colors',
  btnText:      'text-primary text-[13px] hover:underline underline-offset-2',

  input: 'bg-surface border border-border rounded-input px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light w-full transition-colors',

  actionCard: 'bg-[rgba(123,174,132,0.08)] border border-[rgba(123,174,132,0.2)] rounded-card p-4',
  crisisCard: 'bg-[#FEF2F2] border border-[rgba(192,57,43,0.2)] rounded-card p-4',
}
