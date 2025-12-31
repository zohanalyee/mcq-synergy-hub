import { motion } from 'framer-motion';
import { Target, GraduationCap, Briefcase, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLearning } from '@/contexts/LearningContext';
import { getLevelsBySystem } from '@/services/lmsStructureService';
import { useState } from 'react';
import { Level } from '@/types/lms.types';

const WelcomeScreen = () => {
  const { systems, setActiveContext } = useLearning();
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loadingLevels, setLoadingLevels] = useState(false);

  const handleSystemSelect = async (systemId: string) => {
    setSelectedSystemId(systemId);
    setLoadingLevels(true);
    try {
      const levelsData = await getLevelsBySystem(systemId);
      setLevels(levelsData);
    } catch (error) {
      console.error('Error loading levels:', error);
    } finally {
      setLoadingLevels(false);
    }
  };

  const handleLevelSelect = async (levelId: string) => {
    if (selectedSystemId) {
      await setActiveContext({ system_id: selectedSystemId, level_id: levelId });
    }
  };

  const handleBack = () => {
    setSelectedSystemId(null);
    setLevels([]);
  };

  const getSystemIcon = (type: 'academic' | 'job') => {
    return type === 'academic' ? (
      <GraduationCap className="h-8 w-8" />
    ) : (
      <Briefcase className="h-8 w-8" />
    );
  };

  const selectedSystem = systems.find(s => s.id === selectedSystemId);

  return (
    <div className="container px-4 py-8 mx-auto max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Target className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome to MCQs Point!
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          {selectedSystemId 
            ? `Select your level in ${selectedSystem?.name}`
            : 'Choose your learning goal to get personalized content'}
        </p>
      </motion.div>

      {!selectedSystemId ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {systems.map((system, index) => (
            <motion.div
              key={system.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card 
                className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all duration-300 group"
                onClick={() => handleSystemSelect(system.id)}
              >
                <CardHeader className="pb-2">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-2 ${
                    system.type === 'academic' 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {getSystemIcon(system.type)}
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    {system.name}
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardTitle>
                  <CardDescription>{system.description || `${system.levelCount || 0} levels available`}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {system.type === 'academic' 
                      ? 'Academic curriculum and exam preparation'
                      : 'Job preparation and competitive exams'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4" 
            onClick={handleBack}
          >
            ← Back to systems
          </Button>

          {loadingLevels ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : levels.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <p className="text-muted-foreground">No levels available for this system yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {levels.map((level, index) => (
                <motion.div
                  key={level.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card 
                    className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200 group"
                    onClick={() => handleLevelSelect(level.id)}
                  >
                    <CardHeader className="py-4">
                      <CardTitle className="text-base flex items-center justify-between">
                        {level.name}
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {level.subjectCount || 0} subjects
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default WelcomeScreen;
