import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Collection_Key {
  id: UUIDString;
  __typename?: 'Collection_Key';
}

export interface CreateGroupData {
  group_insert: Group_Key;
}

export interface CreateGroupVariables {
  name: string;
  type: string;
  adminUserId: UUIDString;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface CreateUserVariables {
  fullName: string;
  email: string;
  role: string;
}

export interface Draw_Key {
  id: UUIDString;
  __typename?: 'Draw_Key';
}

export interface Group_Key {
  id: UUIDString;
  __typename?: 'Group_Key';
}

export interface JoinGroupData {
  membership_insert: Membership_Key;
}

export interface JoinGroupVariables {
  userId: UUIDString;
  groupId: UUIDString;
}

export interface ListGroupsData {
  groups: ({
    id: UUIDString;
    name: string;
    type: string;
    adminUser: {
      fullName: string;
      email: string;
    };
  } & Group_Key)[];
}

export interface Loan_Key {
  id: UUIDString;
  __typename?: 'Loan_Key';
}

export interface Membership_Key {
  id: UUIDString;
  __typename?: 'Membership_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;
export function createUser(dc: DataConnect, vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface CreateGroupRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateGroupVariables): MutationRef<CreateGroupData, CreateGroupVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateGroupVariables): MutationRef<CreateGroupData, CreateGroupVariables>;
  operationName: string;
}
export const createGroupRef: CreateGroupRef;

export function createGroup(vars: CreateGroupVariables): MutationPromise<CreateGroupData, CreateGroupVariables>;
export function createGroup(dc: DataConnect, vars: CreateGroupVariables): MutationPromise<CreateGroupData, CreateGroupVariables>;

interface ListGroupsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListGroupsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListGroupsData, undefined>;
  operationName: string;
}
export const listGroupsRef: ListGroupsRef;

export function listGroups(options?: ExecuteQueryOptions): QueryPromise<ListGroupsData, undefined>;
export function listGroups(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListGroupsData, undefined>;

interface JoinGroupRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: JoinGroupVariables): MutationRef<JoinGroupData, JoinGroupVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: JoinGroupVariables): MutationRef<JoinGroupData, JoinGroupVariables>;
  operationName: string;
}
export const joinGroupRef: JoinGroupRef;

export function joinGroup(vars: JoinGroupVariables): MutationPromise<JoinGroupData, JoinGroupVariables>;
export function joinGroup(dc: DataConnect, vars: JoinGroupVariables): MutationPromise<JoinGroupData, JoinGroupVariables>;

