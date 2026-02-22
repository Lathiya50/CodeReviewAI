"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Final call-to-action section with compelling design.
 * Encourages users to sign up.
 * @returns JSX.Element - CTA section component
 */
export function CTASection() {
  return (
    <section className="border-t border-border/40 py-24">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-purple-600/90 to-pink-600/90" />

          {/* Animated circles */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
              transition={{ duration: 20, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/5"
              animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }}
              transition={{ duration: 25, repeat: Infinity }}
            />
          </div>

          {/* Content */}
          <div className="relative px-8 py-16 sm:px-16 sm:py-20 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm text-white/90 mb-6"
            >
              <Sparkles className="h-4 w-4" />
              Start free, upgrade anytime
            </motion.div>

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Ready to transform your
              <br />
              code review process?
            </h2>

            <p className="mt-6 text-lg text-white/80 max-w-xl mx-auto">
              Join thousands of developers shipping better code, faster. Get
              started in under 5 minutes with no credit card required.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 group"
                asChild
              >
                <Link href="/sign-up">
                  Get started for free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="w-full sm:w-auto text-white border-white/30 hover:bg-white/10"
                asChild
              >
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
