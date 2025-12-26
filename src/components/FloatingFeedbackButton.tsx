
import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FeedbackForm from '@/components/FeedbackForm';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const FloatingFeedbackButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      {/* Floating Button - positioned above mobile bottom nav */}
      <div className="fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-12 w-12 shadow-lg hover:shadow-xl transition-all duration-200"
          size="icon"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>

      {/* Feedback Dialog/Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Content */}
          <Card className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-auto">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Provide Feedback</CardTitle>
                  <CardDescription>
                    Help us improve MCQs Point by sharing your thoughts
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {user ? (
                <FeedbackForm />
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">
                    Please sign in to submit feedback
                  </p>
                  <Button asChild onClick={() => setIsOpen(false)}>
                    <Link to="/signin">Sign In</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default FloatingFeedbackButton;
