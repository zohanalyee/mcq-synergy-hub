
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FeedbackForm from '@/components/FeedbackForm';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Feedback = () => {
  const { user } = useAuth();

  return (
    <div className="container max-w-3xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>Provide Feedback</CardTitle>
          <CardDescription>
            Help us improve MCQs Point by sharing your thoughts and suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <FeedbackForm />
          ) : (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">
                Please sign in to submit feedback
              </p>
              <Button asChild>
                <Link to="/signin">Sign In</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Feedback;
