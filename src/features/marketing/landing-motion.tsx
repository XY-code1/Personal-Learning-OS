"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type ReactNode, useRef } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function LandingMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const select = gsap.utils.selector(scope);
    const media = gsap.matchMedia();
    const hero = select(".landing-hero")[0];
    const flowSection = select(".landing-flow-section")[0];

    media.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(select(".landing-reveal, .hero-copy > *, .landing-nav, .workspace-preview-wrap, .reflection-version, .timeline-event"), {
        clearProps: "all",
        autoAlpha: 1,
        x: 0,
        y: 0,
        scale: 1,
        filter: "none",
      });
    });

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const isMobile = window.matchMedia("(max-width: 760px)").matches;
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

      intro
        .from(select(".landing-nav"), { autoAlpha: 0, y: -10, duration: 0.55 }, 0)
        .from(select(".hero-eyebrow"), { autoAlpha: 0, y: 14, filter: "blur(5px)", duration: 0.5 }, 0.12)
        .from(select(".hero-title-line"), { autoAlpha: 0, y: 24, filter: "blur(6px)", duration: 0.72, stagger: isMobile ? 0.08 : 0.12 }, 0.22)
        .from(select(".hero-subtitle"), { autoAlpha: 0, y: 14, filter: "blur(4px)", duration: 0.5 }, 0.68)
        .from(select(".hero-actions"), { autoAlpha: 0, y: 16, duration: 0.52 }, 0.82)
        .fromTo(select(".workspace-preview-wrap"), { autoAlpha: 0, y: 52, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.95, ease: "power2.out" }, 0.92)
        .from(select(".collage-note, .collage-node"), { autoAlpha: 0, y: 14, duration: 0.48, stagger: isMobile ? 0.04 : 0.08 }, 1.12);

      if (hero && !isMobile) {
        gsap.to(select(".hero-title"), {
          y: -34,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1 },
        });
        gsap.to(select(".workspace-preview-wrap"), {
          y: -48,
          scale: 1.02,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1.1 },
        });
        gsap.to(select(".hero-organic-one"), {
          y: -92,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1.2 },
        });
        gsap.to(select(".hero-organic-two"), {
          y: -34,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1.4 },
        });
      }

      if (flowSection) {
        const flowItems = select(".learning-flow-item");
        const flowTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: flowSection,
            start: "top 72%",
            end: "bottom 46%",
            scrub: 0.8,
            onUpdate: (trigger) => {
              const activeIndex = Math.min(flowItems.length - 1, Math.floor(trigger.progress * flowItems.length));
              flowItems.forEach((item, index) => item.classList.toggle("is-active", index === activeIndex));
            },
          },
        });

        flowTimeline.fromTo(
          flowItems,
          { autoAlpha: 0, y: isMobile ? 16 : 24 },
          { autoAlpha: 1, y: 0, duration: 0.7, stagger: isMobile ? 0.18 : 0.32 },
          0,
        );

        if (!isMobile) {
          flowTimeline.fromTo(
            select(".learning-flow-connector"),
            { scaleX: 0, transformOrigin: "left center" },
            { scaleX: 1, duration: 0.42, stagger: 0.32, ease: "none" },
            0.18,
          );
        }
      }

      select(".landing-story, .landing-projects").forEach((section, index) => {
        const copy = section.querySelector(".landing-story-copy, .project-copy");
        const visual = section.querySelector(".story-visual, .project-preview");
        const visualOffset = isMobile ? (index % 2 === 0 ? 12 : -12) : index % 2 === 0 ? 30 : -30;

        if (copy) {
          gsap.fromTo(copy, { autoAlpha: 0, y: isMobile ? 20 : 28 }, {
            autoAlpha: 1,
            y: 0,
            duration: 0.72,
            ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 76%", toggleActions: "play none none reverse" },
          });
        }
        if (visual) {
          gsap.fromTo(visual, { autoAlpha: 0, x: visualOffset }, {
            autoAlpha: 1,
            x: 0,
            duration: 0.82,
            ease: "power2.out",
            scrollTrigger: { trigger: section, start: "top 76%", toggleActions: "play none none reverse" },
          });
        }
      });

      const reveal = (selector: string, x = 0, y = 24) => {
        const horizontalOffset = isMobile ? Math.round(x * 0.5) : x;
        const verticalOffset = isMobile ? Math.round(y * 0.8) : y;

        select(selector).forEach((element) => {
          gsap.fromTo(element, { autoAlpha: 0, x: horizontalOffset, y: verticalOffset }, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: 0.72,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 82%", toggleActions: "play none none reverse" },
          });
        });
      };

      reveal(".landing-section-intro", 0, 24);
      reveal(".timeline-heading", -18, 20);
      reveal(".landing-ai-heading", -18, 22);
      reveal(".ai-window", 18, 28);
      reveal(".landing-final-cta .landing-reveal", 0, 20);

      const reflection = select(".landing-reflection")[0];
      const reflectionLine = select(".reflection-line")[0];
      const reflectionVersions = select(".reflection-version");

      if (reflection && reflectionLine && reflectionVersions.length) {
        if (isMobile) {
          gsap.set(reflectionLine, { scaleY: 1 });
          gsap.fromTo(
            reflectionVersions,
            { autoAlpha: 0, y: 18 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.56,
              stagger: 0.22,
              ease: "power2.out",
              scrollTrigger: {
                trigger: reflection,
                start: "top 78%",
                toggleActions: "play none none reverse",
              },
            },
          );
        } else {
          const reflectionTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: reflection,
              start: "top 78%",
              end: "bottom 38%",
              scrub: 0.9,
            },
          });
          reflectionTimeline
            .fromTo(reflectionLine, { scaleY: 0, transformOrigin: "top center" }, { scaleY: 1, duration: 1, ease: "none" }, 0)
            .fromTo(reflectionVersions, { autoAlpha: 0, x: 26 }, { autoAlpha: 1, x: 0, duration: 0.6, stagger: 0.42, ease: "power2.out" }, 0.04);
        }
      }

      const timelineSection = select(".landing-timeline-section")[0];
      const timelineLine = select(".timeline-line")[0];
      const timelineEvents = select(".timeline-event");

      if (timelineSection && timelineLine && timelineEvents.length) {
        if (isMobile) {
          gsap.set(timelineLine, { scaleY: 1 });
          gsap.fromTo(
            timelineEvents,
            { autoAlpha: 0, y: 18 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.52,
              stagger: 0.14,
              ease: "power2.out",
              scrollTrigger: {
                trigger: timelineSection,
                start: "top 78%",
                toggleActions: "play none none reverse",
              },
            },
          );
        } else {
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: timelineSection,
              start: "top 76%",
              end: "bottom 44%",
              scrub: 0.85,
            },
          });
          timeline
            .fromTo(timelineLine, { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 1, ease: "none" }, 0)
            .fromTo(timelineEvents, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.18, ease: "power2.out" }, 0.08);
        }
      }

      const refreshId = window.requestAnimationFrame(() => ScrollTrigger.refresh());
      return () => window.cancelAnimationFrame(refreshId);
    });

    return () => media.revert();
  }, { scope });

  return <div ref={scope} className="landing-motion-root">{children}</div>;
}
