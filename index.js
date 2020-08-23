#!/usr/bin/env

const fs = require('fs')

const yaml = require('js-yaml')
const traverse = require('traverse')
const fse = require('fs-extra')

const cwd = process.cwd()

let noCommentConfigPath

if (fs.existsSync(`${cwd}/docs/nocomment.yaml`)) {
  noCommentConfigPath = `${cwd}/docs/nocomment.yaml`
}
if (fs.existsSync(`${cwd}/docs/nocomment.yml`)) {
  noCommentConfigPath = `${cwd}/docs/nocomment.yml`
}

if (!noCommentConfigPath) {
  throw Error('You must have a /docs/nocomment.yaml (or .yml) file')
}

const config = yaml.safeLoad(fs.readFileSync(noCommentConfigPath, 'utf8'))

traverse(config).forEach(function (x) {
  if (this.node === null || typeof this.node === 'string') {
    const relativePathDeclared = this.path.join('/')
    const sourcePath = `${cwd}/${relativePathDeclared}`
    const docsPath = `${cwd}/docs/${relativePathDeclared}.md`

    if (!fs.existsSync(sourcePath)) {
      throw Error(`File ${sourcePath} is declared in nocomment.yaml but does not exist`)
    }
    const sourceContent = fs.readFileSync(sourcePath, 'utf8')
    const oldDocContent = fs.readFileSync(docsPath, 'utf8')
    const type = typeof this.node === 'string' ? this.node : this.key.split('.').pop()

    const separationToken = '\n\n<!-- nocomment -->\n'

    const [codePart, docPart = ''] = oldDocContent.split(separationToken)
    const newDocContent = `[${this.key}](/${relativePathDeclared})

\`\`\`${type}\n${sourceContent}\n\`\`\`${separationToken}${docPart}`

    fse.outputFileSync(docsPath, newDocContent)
    console.log(`Wrote ${docsPath}`)
  }
})

