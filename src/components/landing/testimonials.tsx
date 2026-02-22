"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    quote:
      "CodeReviewAI cut our review time in half. Our team ships faster and with more confidence than ever before.",
    author: "Sarah Chen",
    role: "Engineering Lead",
    company: "TechStart",
    initials: "SC",
  },
  {
    quote:
      "The security scanning alone is worth it. It caught a critical vulnerability in our auth flow that we missed.",
    author: "Marcus Rodriguez",
    role: "Senior Developer",
    company: "DevFlow",
    initials: "MR",
  },
  {
    quote:
      "Finally, code reviews that don't slow us down. The AI suggestions are surprisingly accurate and helpful.",
    author: "Emily Watson",
    role: "CTO",
    company: "BuildIt",
    initials: "EW",
  },
];

/**
 * Testimonials section with user quotes.
 * Builds trust through social proof.
 * @returns JSX.Element - Testimonials section component
 */
export function Testimonials() {
  return (
    <section className="border-t border-border/40 py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-4">
            <Star className="h-4 w-4" />
            Testimonials
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by developers{" "}
            <span className="text-gradient-animated">worldwide</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See what teams are saying about CodeReviewAI.
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="glass-card h-full rounded-2xl p-6">
                {/* Quote icon */}
                <Quote className="h-8 w-8 text-primary/20 mb-4" />

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-500 text-yellow-500"
                    />
                  ))}
                </div>

                {/* Quote text */}
                <p className="text-foreground leading-relaxed">
                  "{testimonial.quote}"
                </p>

                {/* Author info */}
                <div className="mt-6 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
