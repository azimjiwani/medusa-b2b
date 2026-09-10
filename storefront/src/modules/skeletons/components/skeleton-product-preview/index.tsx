const SkeletonProductPreview = () => (
  <div
    aria-hidden="true"
    className="flex h-full min-h-[410px] animate-pulse flex-col rounded-[24px] bg-white p-7 shadow-[0_4px_20px_rgba(0,0,0,0.035)]"
  >
    <div className="mb-7 h-52 rounded-2xl bg-[#f5f5f7]" />
    <div className="mb-3 h-2 w-24 rounded-full bg-[#eeeef0]" />
    <div className="mb-2 h-4 w-full rounded-full bg-[#eeeef0]" />
    <div className="h-4 w-2/3 rounded-full bg-[#eeeef0]" />
    <div className="mt-auto pt-5">
      <div className="h-3 w-3/4 rounded-full bg-[#f5f5f7]" />
    </div>
  </div>
)

export default SkeletonProductPreview
