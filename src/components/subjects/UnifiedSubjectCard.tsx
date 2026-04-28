import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getSubjectTheme } from "@/lib/subjectTheme";
import { getSyncStatus } from "@/services/offlineSyncService";

export interface UnifiedSubjectTopic {
  id: string;
  name: string;
  isSelected?: boolean;
}

export interface UnifiedSubjectModel {
  id: string;
  name: string;
  level?: string;
  levelId?: string;
  system?: string;
  systemId?: string;
  topicCount?: number;
  mcqCount?: number;
  topics?: UnifiedSubjectTopic[];
  icon?: React.ReactNode;
  description?: string;
}

export interface UnifiedSubjectSelectionAPI {
  isSelected?: boolean;
  isIndeterminate?: boolean;
  isExpanded?: boolean;
  onToggleSubject: (subjectId: string) => void;
  onToggleTopic: (subjectId: string, topicId: string) => void;
  onToggleExpand: (subjectId: string) => void;
  /** Optional per-topic Q counts for the topics list. */
  topicQuestionCounts?: Record<string, number>;
}

interface BaseProps {
  subject: UnifiedSubjectModel;
  className?: string;
}

interface NavigateProps extends BaseProps {
  variant: "navigate";
  selection?: never;
  /** Optional click override. If omitted, card links to /subject-content/:id. */
  onClick?: () => void;
  /** Optional state to pass to the navigation Link. */
  linkState?: Record<string, unknown>;
}

interface SelectProps extends BaseProps {
  variant: "select";
  selection: UnifiedSubjectSelectionAPI;
  onClick?: never;
  linkState?: never;
}

export type UnifiedSubjectCardProps = NavigateProps | SelectProps;

const MotionLink = motion.create(Link);
const MotionDiv = motion.div;

const renderIcon = (icon: React.ReactNode) => {
  if (React.isValidElement(icon)) {
    return React.cloneElement(icon as React.ReactElement<any>, {
      className: "h-4 w-4 text-white",
      style: { color: "white" },
    });
  }
  return <BookOpen className="h-4 w-4 text-white" />;
};

export const UnifiedSubjectCard: React.FC<UnifiedSubjectCardProps> = (
  props
) => {
  const { subject, variant, className } = props;
  const theme = useMemo(
    () => getSubjectTheme(subject.name, subject.system),
    [subject.name, subject.system]
  );

  const syncStatus = subject.id
    ? getSyncStatus(subject.id)
    : { synced: false, count: 0, lastSync: null };

  const topicCount = subject.topicCount ?? subject.topics?.length ?? 0;
  const mcqCount = subject.mcqCount ?? 0;

  const isSelectVariant = variant === "select";
  const selection = isSelectVariant ? props.selection : undefined;
  const isExpanded = !!selection?.isExpanded;

  // Header / shared chrome
  const Header = (
    <div className="flex items-start gap-2">
      {isSelectVariant && (
        <Checkbox
          checked={!!selection?.isSelected}
          // @ts-ignore — indeterminate is valid on input
          ref={(el: HTMLInputElement | null) =>
            el && (el.indeterminate = !!selection?.isIndeterminate)
          }
          onCheckedChange={() => selection?.onToggleSubject(subject.id)}
          className="mt-1 h-3.5 w-3.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Icon squircle */}
      <div className="relative shrink-0">
        <div
          className="w-9 h-9 rounded-xl shadow-md flex items-center justify-center
                     transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundColor: theme.main }}
        >
          {renderIcon(subject.icon)}
        </div>
        {syncStatus.synced && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                  <WifiOff className="w-2 h-2 text-white" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {syncStatus.count} questions cached offline
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Title + system sub-line */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1 flex-wrap">
          <h3
            className="font-semibold text-[13px] leading-tight text-foreground truncate min-w-0 flex-1"
            title={subject.name}
          >
            {subject.name}
          </h3>
          {subject.level && (
            <Badge
              variant="secondary"
              title={subject.level}
              className="text-[9px] h-4 px-1.5 shrink-0 font-semibold border-0 truncate max-w-[140px] block"
              style={{
                backgroundColor: theme.light,
                color: theme.main,
              }}
            >
              {subject.level}
            </Badge>
          )}
        </div>
        {subject.system && (
          <p
            className="text-[10px] text-muted-foreground mt-0.5 truncate"
            title={subject.system}
          >
            {subject.system}
          </p>
        )}
      </div>
    </div>
  );

  // Stats row
  const Stats = (topicCount > 0 || mcqCount > 0) && (
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-2">
      {topicCount > 0 && (
        <span className="inline-flex items-center gap-1">
          <BookOpen className="h-3 w-3" style={{ color: theme.main }} />
          <span className="font-semibold text-foreground/80">
            {topicCount}
          </span>{" "}
          Topics
        </span>
      )}
      {mcqCount > 0 && (
        <>
          <span className="opacity-40">•</span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" style={{ color: theme.main }} />
            <span className="font-semibold text-foreground/80">
              {mcqCount}
            </span>{" "}
            MCQs
          </span>
        </>
      )}
    </div>
  );

  // Footer action row
  const Footer = (
    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50">
      {isSelectVariant ? (
        <CollapsibleTrigger asChild>
          <button
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="text-[9px] font-bold uppercase tracking-wide"
              style={{ color: theme.main }}
            >
              {isExpanded ? "Hide topics" : "View topics"}
            </span>
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                isExpanded && "rotate-180"
              )}
              style={{ color: theme.main }}
            />
          </button>
        </CollapsibleTrigger>
      ) : (
        <span
          className="text-[9px] font-bold uppercase tracking-wide"
          style={{ color: theme.main }}
        >
          {topicCount > 0 ? `${topicCount} Chapters` : "Practice now"}
        </span>
      )}

      <motion.div
        className="w-6 h-6 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md"
        style={{ backgroundColor: theme.main }}
        whileHover={{ rotate: -45 }}
        transition={{ duration: 0.2 }}
      >
        <ArrowRight className="w-3 h-3 text-white" />
      </motion.div>
    </div>
  );

  // The select variant renders the topics expandable section as a floating overlay
  const TopicsList = isSelectVariant && (
    <CollapsibleContent
      forceMount
      className={cn(
        "absolute left-0 top-full z-50 w-full",
        "bg-popover text-popover-foreground border border-t-0 rounded-b-2xl shadow-xl",
        "data-[state=closed]:hidden"
      )}
      style={{ borderColor: theme.border }}
    >
      <div className="px-2.5 pb-2.5 pt-0">
        <div className="pt-2 space-y-0.5 max-h-[260px] overflow-y-auto scrollbar-thin">
          {subject.topics && subject.topics.length > 0 ? (
            subject.topics.map((topic) => (
              <label
                key={topic.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/60 cursor-pointer transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={!!topic.isSelected}
                  onCheckedChange={() =>
                    selection?.onToggleTopic(subject.id, topic.id)
                  }
                  className="h-3.5 w-3.5"
                />
                <span className="text-[11px] text-foreground/85 truncate flex-1">
                  {topic.name}
                  {selection?.topicQuestionCounts?.[topic.id] ? (
                    <span className="text-[9px] text-muted-foreground ml-1">
                      ({selection.topicQuestionCounts[topic.id]} Qs)
                    </span>
                  ) : null}
                </span>
              </label>
            ))
          ) : (
            <p className="text-[10px] text-muted-foreground py-2 text-center">
              No topics available
            </p>
          )}
        </div>
      </div>
    </CollapsibleContent>
  );

  // Card body (shared)
  const cardInner = (
    <div
      className={cn(
        "h-full border shadow-sm hover:shadow-lg transition-all duration-300",
        "backdrop-blur-sm rounded-t-2xl",
        isSelectVariant && isExpanded ? "rounded-b-none" : "rounded-b-2xl",
        (selection?.isSelected || selection?.isIndeterminate) &&
          "ring-2 ring-primary/40"
      )}
      style={{
        background: `linear-gradient(135deg, ${theme.surface} 0%, hsl(var(--card) / 0.95) 100%)`,
        borderColor: theme.border,
      }}
    >
      {isSelectVariant ? (
        <Collapsible
          open={isExpanded}
          onOpenChange={() => selection?.onToggleExpand(subject.id)}
        >
          <div className="p-2.5">
            {Header}
            {Stats}
            {Footer}
          </div>
          {TopicsList}
        </Collapsible>
      ) : (
        <div className="p-2.5">
          {Header}
          {Stats}
          {Footer}
        </div>
      )}
    </div>
  );

  const sharedMotion = {
    whileHover: { y: -3 },
    whileTap: { scale: 0.98 },
    transition: { type: "spring" as const, stiffness: 400, damping: 22 },
    className: cn(
      "cursor-pointer w-full group block relative",
      isSelectVariant && isExpanded && "z-40",
      className
    ),
    "aria-label": subject.name,
  };

  if (isSelectVariant) {
    return <MotionDiv {...sharedMotion}>{cardInner}</MotionDiv>;
  }

  // Navigate variant — always render as <a> Link for right-click / new-tab / SEO.
  const navProps = props as NavigateProps;
  const linkTo =
    `/subject-content/${
      subject.id ||
      encodeURIComponent(subject.name.toLowerCase().replace(/\s+/g, "-"))
    }`;

  return (
    <MotionLink
      to={linkTo}
      state={navProps.linkState}
      onClick={(e) => {
        if (navProps.onClick) {
          // Allow modifier-clicks / middle-click to behave as native link
          if (
            e.defaultPrevented ||
            e.button !== 0 ||
            e.metaKey ||
            e.ctrlKey ||
            e.shiftKey ||
            e.altKey
          ) {
            return;
          }
          e.preventDefault();
          navProps.onClick();
        }
      }}
      {...sharedMotion}
    >
      {cardInner}
    </MotionLink>
  );
};

export default UnifiedSubjectCard;
