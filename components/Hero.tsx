export default function Hero() {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <h1 className="text-[34px] leading-tight font-semibold tracking-[-0.02em] text-[var(--color-foreground)]">
        AI 训练计划生成器
      </h1>
      <p className="text-sm text-[var(--color-secondary)]">
        基于你的状态，生成个性化训练计划
      </p>
    </div>
  );
}
