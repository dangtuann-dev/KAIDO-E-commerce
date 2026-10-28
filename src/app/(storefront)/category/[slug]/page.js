import CategoryPage, {
  generateMetadata as buildCategoryMetadata,
} from '@/modules/m02-catalog/client/pages/CategoryPage.jsx';

export const dynamic = 'force-dynamic';

export const generateMetadata = buildCategoryMetadata;

export default CategoryPage;
