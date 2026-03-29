"use client";

import CountUp from "react-countup";

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  end,
  duration = 1.5,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: AnimatedCounterProps) {
  return (
    <CountUp
      end={end}
      duration={duration}
      decimals={decimals}
      prefix={prefix}
      suffix={suffix}
      className={className}
    />
  );
}
