export default function log(msg) {
  const date = new Date();
  const formattedDate = `${date.getFullYear()}-${date.getMonth() +
    1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  console.log(`[${formattedDate}] ${msg}`);
}
