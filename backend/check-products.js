module.exports = async function (container) {
  const productService = container.resolve("product");
  const [products, count] = await productService.listAndCount({});
  console.log("Total products in database:", count);
  console.log("First 10 product handles:", products.slice(0, 10).map(p => p.handle));
}