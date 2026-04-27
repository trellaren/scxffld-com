declare module 'react-aws-icons/dist/aws/*' {
  import { ComponentType } from 'react'
  interface AWSIconProps {
    size?: number
    [key: string]: unknown
  }
  const AWSIcon: ComponentType<AWSIconProps>
  export default AWSIcon
}
