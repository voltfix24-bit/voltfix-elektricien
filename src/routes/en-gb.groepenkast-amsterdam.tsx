import { createFileRoute } from '@tanstack/react-router';
import { GroepenkastPage } from '@/components/groepenkast-page';
import { groepenkastHead } from '@/lib/groepenkast-seo';

export const Route = createFileRoute('/en-gb/groepenkast-amsterdam')({
  head: () => groepenkastHead('en'),
  component: () => <GroepenkastPage lang="en" />,
});
