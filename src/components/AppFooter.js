import React from 'react'
import { CFooter } from '@coreui/react'
import { Link } from 'react-router-dom'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div className='container-copyright'>
        <strong className='text-copyright'>&copy;2023 - {new Date().getFullYear()} <Link to="https://gms.church/id" className='link-copyright no-underline' target="_blank" rel="noopener noreferrer">GMS.</Link></strong>
        <p className='text-reserved'>All rights reserved.</p>
      </div>
      <div className='powered'>
        <strong className="text-powered">Powered by <Link to="https://github.com/CelvinPrananta" className='link-powered no-underline' target="_blank" rel="noopener noreferrer">Kelvin</Link></strong>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)