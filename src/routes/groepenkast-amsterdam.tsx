import { createFileRoute } from '@tanstack/react-router';
import { GroepenkastPage } from '@/components/groepenkast-page';
import { groepenkastHead } from '@/lib/groepenkast-seo';

export const Route = createFileRoute('/groepenkast-amsterdam')({
  head: () => groepenkastHead('nl'),
  component: () => <GroepenkastPage lang="nl" />,
});
