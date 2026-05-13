import gql from 'graphql-tag';

export const GET_ADD_STUFF_SETTINGS = gql`
    query GetAddStuffSettings($sitePath: String!) {
        jcr {
            nodeByPath(path: $sitePath) {
                addStuffHeadTop: property(name: "addStuffHeadTop") { value }
                addStuffHead: property(name: "addStuffHead") { value }
                addStuffBodyTop: property(name: "addStuffBodyTop") { value }
                addStuffBody: property(name: "addStuffBody") { value }
            }
        }
    }
`;

export const SAVE_ADD_STUFF_SETTINGS = gql`
    mutation SaveAddStuffSettings(
        $path: String!
        $addStuffHeadTop: String!
        $addStuffHead: String!
        $addStuffBodyTop: String!
        $addStuffBody: String!
    ) {
        jcr {
            mutateNode(pathOrId: $path) {
                addMixins(mixins: ["jmix:addStuff"])
                p1: mutateProperty(name: "addStuffHeadTop") { setValue(type: STRING, value: $addStuffHeadTop) }
                p2: mutateProperty(name: "addStuffHead")    { setValue(type: STRING, value: $addStuffHead) }
                p3: mutateProperty(name: "addStuffBodyTop") { setValue(type: STRING, value: $addStuffBodyTop) }
                p4: mutateProperty(name: "addStuffBody")    { setValue(type: STRING, value: $addStuffBody) }
            }
        }
    }
`;
