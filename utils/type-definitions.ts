import { FunctionDeclaration, Node } from '@babel/types'

export const isFunction = (node: Node): node is FunctionDeclaration =>
    node.type === 'FunctionDeclaration'
