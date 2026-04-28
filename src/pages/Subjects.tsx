import { motion } from "framer-motion";
import SEOHead from '@/components/SEOHead';
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sparkles, Loader2, Wifi } from "lucide-react";
import Header from "@/components/Header";
import FilterSummary from "@/components/subjects/FilterSummary";
import SubjectGrid from "@/components/subjects/SubjectGrid";
import { GlassSearchInput } from "@/components/ui/GlassSearchInput";
import { GlassFilterSidebar } from "@/components/syllabus-builder/GlassFilterSidebar";
import { GlobalSearchResult } from "@/services/globalSearchService";
import { useSubjectsPageData } from "@/hooks/useSubjectsPageData";
import { Skeleton } from "@/components/ui/skeleton";
import { syncAllSubjects } from "@/services/offlineSyncService";
import { useToast } from "@/hooks/use-toast";

const Subjects = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [syncProgress, setSyncProgress] = useState<{ synced: number; total: number } | null>(null);
  const {
    systems,
    availableLevels,
    subjects,
    subjectMcqCounts,
    loading,
    error,
    filterState,
    toggleSystemFilter,
    toggleLevelFilter,
    setSearchQuery,
    clearFilters,
    isFiltered,
    totalCount
  } = useSubjectsPageData();

  // Background sync for offline access
  useEffect(() => {
    if (loading || subjects.length === 0) return;

    const subjectsToSync = subjects
      .filter(s => s.id)
      .map(s => ({ id: s.id, title: s.title }));

    if (subjectsToSync.length === 0) return;

    toast({
      title: "📥 Syncing for offline",
      description: `Caching questions for ${subjectsToSync.length} subjects...`,
    });

    syncAllSubjects(subjectsToSync, (synced, total) => {
      setSyncProgress({ synced, total });
    }).then(() => {
      setSyncProgress(null);
      toast({
        title: "✅ Offline sync complete",
        description: "Questions are now available offline",
      });
    });
  }, [loading, subjects.length]);

  // Handle smart search selection - navigate to subject content page
  const handleSmartSearchSelect = (item: GlobalSearchResult) => {
    const statePayload = {
      title: item.result_type === 'subject' ? item.name : item.subject_name,
      subjectId: item.result_type === 'subject' ? item.id : item.subject_id,
      levelId: item.level_id,
      levelName: item.level_name,
      systemId: item.system_id,
      systemName: item.system_name,
      color: '#3b82f6'
    };

    if (item.result_type === 'subject') {
      navigate(`/subject-content/${item.id}`, { state: statePayload });
    } else {
      // Navigate to subject with topic pre-selected
      navigate(`/subject-content/${item.subject_id}?topic=${item.id}`, { state: statePayload });
    }
  };

  // Map subjects to the format expected by SubjectGrid
  const mappedSubjects = subjects.map(s => ({
    title: s.title,
    icon: s.icon,
    description: s.description,
    topicCount: s.topicCount,
    color: s.color,
    category: s.category,
    purpose: s.purpose,
    id: s.id,
    levelId: s.levelId,
    systemId: s.systemId
  }));

  return (
    <Header>
      <SEOHead
        title="Practice MCQs by Subject"
        description="Practice Biology, Chemistry, Physics, English, Urdu, Mathematics MCQs for MDCAT, ECAT, and competitive exams in Pakistan."
        keywords="Biology MCQs, Chemistry MCQs, Physics MCQs, subject-wise practice, MDCAT subjects, ECAT subjects"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-2 pb-24">
        <PageBreadcrumb items={[{ title: 'Subjects', href: '/subjects', isCurrent: true }]} showHomeButton={true} />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Explore & Learn</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="text-gradient">Subjects</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Browse subjects from your curriculum, read content, and practice with MCQs. Choose Read Mode for memorization or Practice Mode for self-testing.
          </p>
        </motion.div>
        
        {/* Glass Search + Filter Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <GlassSearchInput
                placeholder="Search subjects or topics..."
                onSelect={handleSmartSearchSelect}
              />
            </div>
            {!loading && (
              <GlassFilterSidebar
                systems={systems.map(s => ({ ...s, description: undefined }))}
                availableLevels={availableLevels}
                filterState={filterState}
                toggleSystemFilter={toggleSystemFilter}
                toggleLevelFilter={toggleLevelFilter}
                clearFilters={clearFilters}
              />
            )}
          </div>
        </motion.div>

        <FilterSummary 
          count={subjects.length} 
          isFiltered={isFiltered} 
          clearFilters={clearFilters} 
        />

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-3 min-h-[100px] flex flex-col border border-border/40 bg-card/60 animate-pulse">
                <Skeleton className="w-9 h-9 rounded-xl mb-2" />
                <Skeleton className="h-3 w-3/4 mb-1" />
                <Skeleton className="h-2 w-1/2 mb-2" />
                <div className="mt-auto pt-2 border-t border-border/30 flex justify-between">
                  <Skeleton className="h-2 w-12" />
                  <Skeleton className="w-6 h-6 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-2">{error}</p>
            <p className="text-muted-foreground text-sm">Please try refreshing the page</p>
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">No subjects found in your LMS.</p>
            <p className="text-sm text-muted-foreground">
              Go to Admin Panel → LMS Structure to add educational systems, levels, and subjects.
            </p>
          </div>
        ) : (
          <SubjectGrid 
            subjects={mappedSubjects} 
            isLoaded={!loading} 
          />
        )}
      </div>
    </Header>
  );
};

export default Subjects;
