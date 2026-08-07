import Image from "next/image"

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex flex-col items-end leading-none">
        <span className="text-2xl md:text-3xl font-black tracking-tight text-primary">
          NEXT GEN
        </span>
        <span className="text-4xl md:text-5xl font-black tracking-tight text-secondary flex items-center">
          PADEL
          <Image
            src="/images/tennis-ball.png"
            alt="Tennis ball"
            width={48}
            height={36}
            className="ml-1 inline-block w-7 md:w-10 h-auto"
          />
        </span>
        <span className="text-2xl md:text-3xl font-black tracking-tight text-primary">
          ACADEMY
        </span>
      </div>
      <p className="text-base md:text-lg font-bold text-secondary mt-1 tracking-wide italic">
        PLAY. LEARN. GROW.
      </p>
    </div>
  )
}
