import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/lib/authOptions'
import { createLemonSqueezySubscription } from '@/app/lib/lemonSqueezy'
import { createGoogleAdsCampaign } from '@/app/lib/googleAds'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Create subscription in Lemon Squeezy
    const subscription = await createLemonSqueezySubscription({
      userId: session.user.id,
      variantId: process.env.LEMON_SQUEEZY_SURF_CAMP_VARIANT_ID!,
    })

    // Create Google Ads campaign
    const campaign = await createGoogleAdsCampaign({
      name: data.name,
      budget: process.env.GOOGLE_ADS_SURF_CAMP_BUDGET!,
      keywords: [`surf camp ${data.location}`, 'surf lessons', 'surf school'],
    })

    // Create surf camp in database
    const surfCamp = await prisma.surfCamp.create({
      data: {
        ...data,
        userId: session.user.id,
        subscriptionId: subscription.id,
        googleAdsCampaignId: campaign.id,
      },
    })

    return NextResponse.json(surfCamp)
  } catch (error) {
    console.error('Error creating surf camp:', error)
    return NextResponse.json(
      { error: 'Failed to create surf camp' },
      { status: 500 }
    )
  }
}