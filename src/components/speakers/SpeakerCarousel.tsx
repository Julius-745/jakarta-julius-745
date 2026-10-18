"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, ChevronLeft, ChevronRight, ExternalLink, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchPublicSpeakers } from "@/lib/api";
import type { EventSpeaker } from "@/lib/types";
import { COMMUNITY_DAY_EVENT_SLUG } from "@/components/sponsor/communityDayConfig";

interface SpeakerCarouselProps {
  eventSlug?: string;
  title?: string;
  subtitle?: string;
}

export function SpeakerCarousel({
  eventSlug = COMMUNITY_DAY_EVENT_SLUG,
  title = "Featured Speakers",
  subtitle = "Learn from industry leaders, AWS heroes, and top cloud practitioners at AWS Community Day Jakarta 2026.",
}: SpeakerCarouselProps) {
  const [speakers, setSpeakers] = useState<EventSpeaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(3);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchPublicSpeakers(eventSlug);
        if (!cancelled) {
          setSpeakers(data.speakers || []);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [eventSlug]);

  // Responsive cards per view
  useEffect(() => {
    const updateCardsPerView = () => {
      if (typeof window === "undefined") return;
      if (window.innerWidth < 640) {
        setCardsPerView(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    };
    updateCardsPerView();
    window.addEventListener("resize", updateCardsPerView);
    return () => window.removeEventListener("resize", updateCardsPerView);
  }, []);

  const maxIndex = Math.max(0, speakers.length - cardsPerView);

  // Auto-advance interval (4 seconds)
  useEffect(() => {
    if (isPaused || maxIndex === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, maxIndex]);

  // Clamp index if view resized
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  if (loading) {
    return (
      <section className="py-16 bg-background relative overflow-hidden">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-10">
            <div className="h-6 w-36 bg-muted/60 animate-pulse rounded-full mx-auto" />
            <div className="h-10 w-72 bg-muted/60 animate-pulse rounded-xl mx-auto" />
            <div className="h-4 w-96 bg-muted/40 animate-pulse rounded-md mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-96 rounded-3xl border border-border bg-card/40 animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || speakers.length === 0) {
    return null;
  }

  return (
    <section id="speakers-carousel" className="py-20 bg-background relative border-b border-border overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute right-0 top-1/3 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute left-0 bottom-1/3 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="container max-w-6xl mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              Community Day Keynotes & Sessions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Carousel Controls */}
          {speakers.length > cardsPerView && (
            <div className="flex items-center gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handlePrev}
                aria-label="Previous speaker"
                className="h-10 w-10 rounded-full border-border bg-card/80 backdrop-blur-sm shadow-sm hover:bg-accent cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleNext}
                aria-label="Next speaker"
                className="h-10 w-10 rounded-full border-border bg-card/80 backdrop-blur-sm shadow-sm hover:bg-accent cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Carousel Content */}
        <div
          className="relative select-none"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="overflow-hidden -mx-3 py-3">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
              }}
            >
              {speakers.map((speaker) => (
                <div
                  key={speaker.id}
                  className="shrink-0 px-3 w-full sm:w-1/2 lg:w-1/3"
                >
                  <Card className="h-full flex flex-col justify-between border-border/80 bg-card/60 backdrop-blur-md rounded-3xl overflow-hidden hover:border-orange-500/40 hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-6 space-y-6 flex flex-col justify-between flex-1">
                      {/* Top Header: Avatar & Formats */}
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="relative">
                            <Avatar className="h-20 w-20 rounded-2xl border-2 border-primary/20 shadow-md group-hover:border-primary/50 transition-colors">
                              <AvatarImage
                                src={speaker.photoUrl}
                                alt={speaker.name}
                                className="object-cover"
                              />
                              <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-xl">
                                {speaker.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                              <Mic className="h-3 w-3" />
                            </span>
                          </div>

                          {speaker.talkFormat && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium"
                            >
                              {speaker.talkFormat}
                            </Badge>
                          )}
                        </div>

                        {/* Speaker Details */}
                        <div>
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                            {speaker.name}
                          </h3>
                          <p className="text-sm font-medium text-muted-foreground mt-0.5">
                            {speaker.role}
                            {speaker.company ? ` at ${speaker.company}` : ""}
                          </p>
                        </div>

                        {/* Talk Title & Bio */}
                        <div className="pt-2 border-t border-border/50 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                            Session Topic
                          </p>
                          <h4 className="font-semibold text-foreground text-base leading-snug line-clamp-2">
                            {speaker.talkTitle}
                          </h4>
                          {speaker.bio && (
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                              {speaker.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer: Social Link */}
                      {speaker.socialUrl && (
                        <div className="pt-4 border-t border-border/40 flex justify-end">
                          <a
                            href={speaker.socialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline underline-offset-4 cursor-pointer"
                          >
                            <span>Speaker Profile</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          {speakers.length > cardsPerView && (
            <div className="flex justify-center items-center gap-1.5 pt-8">
              {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    currentIndex === idx
                      ? "w-8 bg-primary"
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
