import { parse, ParseResult } from '@babel/parser'
import {
    File,
    FunctionDeclaration,
    Identifier,
    Node,
    Pattern,
    RestElement,
} from '@babel/types'
import { isFunction } from './utils/type-definitions'
import { appendFile } from 'fs'

const testCasesTemplate = 'testCasesTemplate'

const ast: ParseResult<File> = parse(
    'function returnArgument(arg: number): number {return arg}',
    { plugins: ['typescript'] }
)

const [node]: Array<Node> = ast.program.body

const getValueByTypeAnnotation = ({
    name,
    typeAnnotation: { type },
}: Identifier) => name

const getParams = (params: Array<Identifier | Pattern | RestElement>) => {
    return params.map((param) => {
        const { typeAnnotation, type } = param

        const hasTypeAnnotation = param.typeAnnotation
        const isIdentifier = param.type === 'Identifier'

        if (hasTypeAnnotation && isIdentifier) {
            const { name } = param
            return { name, value: getValueByTypeAnnotation(param) }
        }

        return { name: 'UNKNOWN_NAME', value: 'UNKNOWN_VALUE' }
    })
}

const getTestCases = (fn: FunctionDeclaration) => {
    const testCases = []
    const hasParams = Boolean(fn.params.length)

    const params = getParams(fn.params)

    const testCase = {
        constants: [...params],
        beforeEach: [],
        it: {
            name: 'should return value',
            expect: `expect(${fn.id.name}(${params
                .map(({ name }) => name)
                .join(', ')})).toBe(${params
                .map(({ value }) => value)
                .join(', ')})`,
        },
        afterEach: [],
    }

    testCases.push(testCase)

    return testCases
}

if (isFunction(node)) {
    const methodName = node.id.name
    const describeBlock = `describe('#${methodName}', () => {${testCasesTemplate}});`
    const testCases = getTestCases(node)
    const stringifiedTestCases = testCases.map(
        ({ it: { name, expect } }) => `it('${name}', () => {${expect}})`
    )

    const test = describeBlock.replace(
        testCasesTemplate,
        stringifiedTestCases.join('')
    )

    appendFile('./test/test.spec.js', test, console.error)
}
