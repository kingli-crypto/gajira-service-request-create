const Jira = require('./common/net/Jira')
const j2m = require('jira2md')

module.exports = class {
  constructor ({ githubEvent, argv, config }) {
    this.Jira = new Jira({
      baseUrl: config.baseUrl,
      token: config.token,
      email: config.email,
    })

    this.config = config
    this.argv = argv
    this.githubEvent = githubEvent
  }

  async execute () {
    const { argv } = this
    const projectKey = argv.servicedesk
    const issuetypeName = argv.issuetype

    const { id: serviceDeskId } = await this.Jira.getServiceDesk( projectKey )

    const { values: requestTypes } = await this.Jira.getRequestTypes( serviceDeskId )

    const requestTypeId = requestTypes.find((item) =>  item.name === issuetypeName )

    if (!requestTypeId) throw new Error(`Unable to find issue type ${issuetypeName}`)

    let providedFields = {
      "serviceDeskId": serviceDeskId,
      "requestTypeId": requestTypeId.id,
    }

    let requestFieldValues = {
      "summary": argv.summary,
      "description": this.translateMarkdown(argv.description).slice(0, 32000), // prevent string overflow. Jira is limited
    }

    if (argv.fields) {
      let fields = JSON.parse(argv.fields)
      for (const [key, value] of Object.entries(fields)) {
        if ( typeof value === 'string' ) fields[key] = this.translateMarkdown(value)
      }

      requestFieldValues = {...requestFieldValues, ...fields}
    }

    if (argv.raiseOnBehalfOf) {
      providedFields["raiseOnBehalfOf"] = argv.raiseOnBehalfOf
    }

    const payload = {...providedFields, requestFieldValues}

    const issue = await this.Jira.createIssue(payload)

    return { issue: issue.issueKey }
  }

  translateMarkdown(text) {
    return j2m.to_jira(text)
  }
}
