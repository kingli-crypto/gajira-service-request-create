const Jira = require('./common/net/Jira')

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
      "description": argv.description,
    }

    if (argv.fields) {
      const fields = JSON.parse(argv.fields)
      requestFieldValues = {...requestFieldValues, ...fields}
    }

    if (argv.raiseOnBehalfOf) {
      providedFields["raiseOnBehalfOf"] = argv.raiseOnBehalfOf
    }

    const payload = {...providedFields, requestFieldValues}

    const issue = await this.Jira.createIssue(payload)

    return { issue: issue.issueKey }
  }
}
