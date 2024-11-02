import 'cypress-file-upload'

describe('template spec', () => {
  it('passes', () => {
    const fileName = 'example.csv'
    cy.visit('/')
    cy.get('#fileInput').selectFile(`cypress/fixtures/${fileName}`, { force: true })
    cy.get('.upload_uploadButton__QjdhZ').click()
    cy.get(':nth-child(1) > .uploadedFiles_fileCardContent__Cr4Ra > .uploadedFiles_fileCardActions__2pfeG > .uploadedFiles_downloadButton__B5LqT').click()
    cy.readFile(`cypress/downloads/${fileName}`).should('exist')
    cy.get(':nth-child(1) > .uploadedFiles_fileCardContent__Cr4Ra > .uploadedFiles_fileCardActions__2pfeG > .uploadedFiles_previewButton__cr2JW').should('be.visible')
  })
})