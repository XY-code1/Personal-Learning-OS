export type UnderstandingReviewVerdict = "sound" | "needs_revision" | "incomplete" | "unclear";

export type UnderstandingReview = {
  kind: "understanding_review";
  knowledgeId: string;
  knowledgeVersionId: string;
  versionNo: number;
  verdict: UnderstandingReviewVerdict;
  confidence: number;
  correctPoints: string[];
  issues: string[];
  missingPoints: string[];
  suggestedRevision: string;
  reviewedAt: string;
};

export type UnderstandingReviewResult = UnderstandingReview | {
  status: "unconfigured" | "unauthenticated" | "not_found";
};
