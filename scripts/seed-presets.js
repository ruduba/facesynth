const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const presets = [
  {
    name: 'Long Chin',
    description: 'Exaggerated chin length for comic effect',
    jsonMetadata: JSON.stringify({
      controls: {
        chinHeight: 1.8,
        jawWidth: 1.0,
        faceScale: 1.0
      }
    })
  },
  {
    name: 'Long Nose',
    description: 'Extended nose length',
    jsonMetadata: JSON.stringify({
      controls: {
        noseLength: 1.6,
        faceScale: 1.0
      }
    })
  },
  {
    name: 'Clown Mouth',
    description: 'Wide, exaggerated smile',
    jsonMetadata: JSON.stringify({
      controls: {
        mouthWidth: 1.7,
        faceScale: 1.0
      }
    })
  },
  {
    name: 'Alien',
    description: 'Extraterrestrial features with large eyes',
    jsonMetadata: JSON.stringify({
      controls: {
        eyeSize: 1.5,
        eyeSpacing: 1.3,
        chinHeight: 0.7,
        faceScale: 1.1
      }
    })
  },
  {
    name: 'Button Nose',
    description: 'Cute small nose',
    jsonMetadata: JSON.stringify({
      controls: {
        noseLength: 0.6,
        faceScale: 1.0
      }
    })
  },
  {
    name: 'Chipmunk Cheeks',
    description: 'Puffed out cheeks',
    jsonMetadata: JSON.stringify({
      controls: {
        cheekPuff: 1.6,
        mouthWidth: 0.8,
        faceScale: 1.0
      }
    })
  },
  {
    name: 'Square Jaw',
    description: 'Strong, angular jawline',
    jsonMetadata: JSON.stringify({
      controls: {
        jawWidth: 1.5,
        chinHeight: 1.2,
        faceScale: 1.0
      }
    })
  },
  {
    name: 'Big Eyes',
    description: 'Enlarged eyes with wide spacing',
    jsonMetadata: JSON.stringify({
      controls: {
        eyeSize: 1.4,
        eyeSpacing: 1.2,
        faceScale: 1.0
      }
    })
  },
  {
    name: 'Slim Face',
    description: 'Narrow face with close-set features',
    jsonMetadata: JSON.stringify({
      controls: {
        jawWidth: 0.7,
        eyeSpacing: 0.8,
        faceScale: 0.9
      }
    })
  },
  {
    name: 'Giant Head',
    description: 'Oversized proportions',
    jsonMetadata: JSON.stringify({
      controls: {
        faceScale: 1.5,
        eyeSize: 1.2,
        mouthWidth: 1.2
      }
    })
  }
];

async function main() {
  console.log('Seeding presets...');

  // Create a system user for presets if it doesn't exist
  let systemUser = await prisma.user.findUnique({
    where: { email: 'system@facesynth.local' }
  });

  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        email: 'system@facesynth.local',
        passwordHash: 'N/A',
        name: 'System',
        tutorialSeen: true
      }
    });
  }

  // Create presets
  for (const preset of presets) {
    const existing = await prisma.mesh.findFirst({
      where: {
        name: preset.name,
        isPreset: true
      }
    });

    if (!existing) {
      await prisma.mesh.create({
        data: {
          userId: systemUser.id,
          name: preset.name,
          description: preset.description,
          filePath: `presets/${preset.name.toLowerCase().replace(/\s+/g, '-')}.stl`,
          jsonMetadata: preset.jsonMetadata,
          isPreset: true
        }
      });
      console.log(`✓ Created preset: ${preset.name}`);
    } else {
      console.log(`- Preset already exists: ${preset.name}`);
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });