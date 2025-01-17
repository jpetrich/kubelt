import { composeResolvers } from '@graphql-tools/resolvers-composition'
import { getDefaultProvider, AlchemyProvider } from '@ethersproject/providers'

import Env from '../../env'
import OortClient from './clients/oort'
import {
  setupContext,
  isAuthorized,
  checkHTTPStatus,
  getRPCResult,
} from './utils'

import { Resolvers } from './typedefs'
import { GraphQLYogaError } from '@graphql-yoga/common'

type ResolverContext = {
  env: Env
  jwt?: string
  coreId?: string
}

const threeIDResolvers: Resolvers = {
  Query: {
    profile: async (_parent: any, {}, { env, jwt }: ResolverContext) => {
      const oortClient = new OortClient(env.OORT, jwt)
      const profileResponse = await oortClient.getProfile()
      await checkHTTPStatus(profileResponse)
      const res = getRPCResult(profileResponse)
      return await res
    },
    profileFromAddress: async (
      _parent: any,
      { address }: { address: string },
      { env }: ResolverContext
    ) => {
      const oortClient = new OortClient(env.OORT)
      const profileResponse = await oortClient.getProfileFromAddress(address)
      await checkHTTPStatus(profileResponse)
      return await getRPCResult(profileResponse)
    },
  },
  Mutation: {
    updateThreeIDProfile: async (
      _parent: any,
      { profile, visibility = 'PRIVATE' },
      { env, jwt, coreId }: ResolverContext
    ) => {
      const oortClient = new OortClient(env.OORT, jwt)
      const profileResponse = await oortClient.getProfile()
      await checkHTTPStatus(profileResponse)
      const currentProfile = await getRPCResult(profileResponse)

      const newProfile = {
        ...currentProfile,
        ...profile,
      }

      const updateResponse = await oortClient.updateProfile(
        newProfile,
        visibility
      )
      await checkHTTPStatus(updateResponse)
      return !!(await getRPCResult(updateResponse))
    },
  },
  Profile: {
    __resolveType: (obj: any) => {
      if (obj.pfp) {
        // TODO: what makes a ThreeIDProfile unique from others?
        return 'ThreeIDProfile'
      }
      return 'DefaultProfile'
    },
  },
  PFP: {
    __resolveType: (obj: any) => {
      if (obj.isToken) {
        return 'NFTPFP'
      }
      return 'StandardPFP'
    },
  },
}

const ThreeIDResolverComposition = {
  'Query.address': [setupContext()],
  'Query.addresses': [setupContext()],
  'Query.profile': [setupContext()],
  'Mutation.updateThreeIDAddress': [setupContext(), isAuthorized()],
  'Query.profileFromAddress': [setupContext()],
  'Mutation.updateThreeIDProfile': [setupContext(), isAuthorized()],
}

export default composeResolvers(threeIDResolvers, ThreeIDResolverComposition)
