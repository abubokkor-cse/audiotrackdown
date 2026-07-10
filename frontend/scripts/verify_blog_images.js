const fs = require('fs');
const path = require('path');

const uniqueUnsplashImages = [
  "1590602847861-f357a9332bbc", "1478737270239-2f02b77fc618", "1489599849927-2ee91cede3ba", 
  "1427504494785-3a9ca7044f45", "1485827404703-89b55fcc595e", "1598488035139-bdbb2231ce04", 
  "1460925895917-afdab827c52f", "1610116306796-6fea9f4fae38", "1484704849700-f032a568e944", 
  "1508700115892-45ecd05ae2ad", "1516280440614-37939bbacd6a", "1487180142328-0c4e37023af5", 
  "1524678606370-a47ad25cb82a", "1478720568477-152d9b164e26", "1626814026160-2237a95fc5a0", 
  "1536440136628-849c177e76a1", "1503676260728-1c00da094a0b", "1497633762265-9d179a990aa6", 
  "1522202176988-66273c2fd55f", "1581091226825-a6a2a5aee158", "1526374965328-7f61d4dc18c5", 
  "1465847899084-d164df4dedc6", "1511671782779-c97d3d27a1d4", "1505740420928-5e560c06d30e", 
  "1551836022-d5d88e9218df", "1590283603385-17ffb3a7f29f", "1454165804606-c3d57bc86b40", 
  "1563986768609-322da13575f3", "1498050108023-c5249f4df085", "1531297484001-80022131f5a1", 
  "1504384308090-c894fdcc538d", "1451187580459-43490279c0fa", "1517694712202-14dd9538aa97", 
  "1550751827-4bd374c3f58b", "1518770660439-4636190af475", "1519389950473-47ba0277781c", 
  "1527689368864-3a821dbccc34", "1531482615713-2afd69097998", "1534528741775-53994a69daeb", 
  "1493612276216-ee3925520721", "1515378791036-0648a3ef77b2", "1506157786151-b8491531f063", 
  "1560250097-0b93528c311a", "1516321318423-f06f85e504b3", "1513258496099-48168024addd", 
  "1528605248644-14dd04022da1", "1434030216411-0b793f4b4173", "1552664730-d307ca884978", 
  "1517245386807-bb43f82c33c4", "1542744173-8e0ee26cf8b3"
];

function getUniqueImageForSlug(slug, sortedSlugs) {
  const index = sortedSlugs.indexOf(slug);
  const resolvedIndex = index === -1 ? 0 : index;
  return uniqueUnsplashImages[resolvedIndex % uniqueUnsplashImages.length];
}

const postsDir = '/Users/md.abubokkor/Documents/Downloader/AIVoiceDub/frontend/content/blog/posts';
const filenames = fs.readdirSync(postsDir).filter(f => f.endsWith('.json'));
const posts = filenames.map(f => {
  const content = JSON.parse(fs.readFileSync(path.join(postsDir, f), 'utf8'));
  return content;
});

const sortedSlugs = posts.map(p => p.slug).sort();

const imageUsage = {};
posts.forEach(post => {
  const imageId = getUniqueImageForSlug(post.slug, sortedSlugs);
  if (!imageUsage[imageId]) {
    imageUsage[imageId] = [];
  }
  imageUsage[imageId].push(post.slug);
});

console.log('--- Image Usage Mapping ---');
for (const [imageId, slugs] of Object.entries(imageUsage)) {
  console.log(`${imageId}: ${slugs.length} posts ->`, slugs);
}
