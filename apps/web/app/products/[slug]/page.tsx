import { ProductDetails } from "./product-details";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  return <ProductDetails slug={slug} />;
}
