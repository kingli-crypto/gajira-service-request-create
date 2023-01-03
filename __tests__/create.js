const nock = require('nock')
const Action = require('../action')

const auth = { email: 'test@email.com', token: 'tokentoken' }
const baseUrl = 'https://example.com'
const config = {
  ...auth,
  baseUrl,
}

const projectKey = 'DEMO'
const issuetypeName = 'Get IT Help'

const { mocks } = require('./helpers')

test(`Should create issue with customfield`, async () => {
  const action = new Action({
    argv: {
      servicedesk: projectKey,
      issuetype: issuetypeName,
      summary: 'This is summary ref/head/blah',
      description: 'This is description ref/head/blah',
      fields: '{"customfield_10171" : "test"}',
    },
    config,
  })

  const createMetaRequest = nock(baseUrl)
    .get('/rest/servicedeskapi/servicedesk/10001/requesttype')
    .reply(200, mocks.jira.responses.createMeta)

  let createIssueRequestBody = {}
  const createIssueRequest = nock(baseUrl)
    .post('/rest/servicedeskapi/request')
    .reply(200, (url, body) => {
      createIssueRequestBody = body

      return {
        issueKey: 'TESTPROJECT-2',
      }
    })

  const getServicedesk = nock(baseUrl)
    .get('/rest/servicedeskapi/servicedesk/DEMO')
    .reply(200, { id: "10001"})

  await createMetaRequest
  await createIssueRequest
  await getServicedesk

  const result = await action.execute()

  expect(createIssueRequestBody).toEqual({
    serviceDeskId: "10001",
    requestTypeId: "11001",
    requestFieldValues: {
      summary: 'This is summary ref/head/blah',
      description: 'This is description ref/head/blah',
      customfield_10171: 'test',
    }
  })

  expect(result).toEqual({
    issue: 'TESTPROJECT-2',
  })
})

test(`Should create simple issue without customfield`, async () => {
  const action = new Action({
    argv: {
      servicedesk: projectKey,
      issuetype: issuetypeName,
      summary: 'This is summary ref/head/blah',
      description: 'This is description ref/head/blah',
    },
    config,
  })

  const createMetaRequest = nock(baseUrl)
    .get('/rest/servicedeskapi/servicedesk/10001/requesttype')
    .reply(200, mocks.jira.responses.createMeta)

  let createIssueRequestBody = {}
  const createIssueRequest = nock(baseUrl)
    .post('/rest/servicedeskapi/request')
    .reply(200, (url, body) => {
      createIssueRequestBody = body

      return {
        issueKey: 'TESTPROJECT-2',
      }
    })
  const getServicedesk = nock(baseUrl)
    .get('/rest/servicedeskapi/servicedesk/DEMO')
    .reply(200, { id: "10001"})

  await createMetaRequest
  await createIssueRequest
  await getServicedesk

  const result = await action.execute()

  expect(createIssueRequestBody).toEqual({
    serviceDeskId: "10001",
    requestTypeId: "11001",
    requestFieldValues: {
      summary: 'This is summary ref/head/blah',
      description: 'This is description ref/head/blah',
    }
  })

  expect(result).toEqual({
    issue: 'TESTPROJECT-2',
  })
})
