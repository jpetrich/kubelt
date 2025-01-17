export default /* GraphQL */ `
  enum ThreeIDAddressType {
    ENS
    ETHEREUM
    EMAIL
  }

  type ThreeIDAddress {
    type: ThreeIDAddressType!
    address: String!
    visibility: Visibility!
    threeID: ID!
  }

  input ThreeIDAddressInput {
    type: ThreeIDAddressType!
    address: String!
    visibility: Visibility!
    threeID: ID!
  }

  type Query {
    address(address: String!): ThreeIDAddress
    addresses: [ThreeIDAddress]
  }

  type Mutation {
    updateThreeIDAddress(
      address: ThreeIDAddressInput!
      visible: Boolean
    ): ThreeIDAddress
  }
`;
