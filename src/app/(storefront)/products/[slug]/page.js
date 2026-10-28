import ProductDetailPage, {
  generateMetadata as buildProductMetadata,
} from '@/modules/m02-catalog/client/pages/ProductDetailPage.jsx';

export const dynamic = 'force-dynamic';

export const generateMetadata = buildProductMetadata;

export default ProductDetailPage;
