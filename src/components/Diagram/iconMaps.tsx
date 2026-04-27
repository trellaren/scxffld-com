import EC2Icon from 'react-aws-icons/dist/aws/compute/Instance'
import LambdaIcon from 'react-aws-icons/dist/aws/compute/LambdaFunction'
import LoadBalancerIcon from 'react-aws-icons/dist/aws/compute/LoadBalancer'
import AutoScalingIcon from 'react-aws-icons/dist/aws/compute/AutoScaling'
import ECSIcon from 'react-aws-icons/dist/aws/compute/Cluster'
import CloudWatchIcon from 'react-aws-icons/dist/aws/compute/CloudWatch'
import VPCIcon from 'react-aws-icons/dist/aws/compute/VPC'
import NATGatewayIcon from 'react-aws-icons/dist/aws/compute/NATGateway'
import ElasticIPIcon from 'react-aws-icons/dist/aws/compute/ElasticIPAddress'
import InternetGatewayIcon from 'react-aws-icons/dist/aws/compute/InternetGateway'
import S3BucketIcon from 'react-aws-icons/dist/aws/storage/Bucket'
import RDSIcon from 'react-aws-icons/dist/aws/db/DBR'
import { AzVirtualMachine, AzAppService, AzSQLDatabase, AzStorage, AzKeyVault, AzVirtualNetwork, AzFunctions, AzLoadBalancer, AzContainerService, AzEventHubs } from 'azure-react-icons'

import type { ComponentType } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = ComponentType<any>

export const AWS_ICON_MAP: Record<string, IconComponent> = {
  'EC2 Instance': EC2Icon,
  'Lambda': LambdaIcon,
  'Load Balancer': LoadBalancerIcon,
  'Auto Scaling': AutoScalingIcon,
  'ECS Cluster': ECSIcon,
  'CloudWatch': CloudWatchIcon,
  'VPC': VPCIcon,
  'NAT Gateway': NATGatewayIcon,
  'Elastic IP': ElasticIPIcon,
  'Internet Gateway': InternetGatewayIcon,
  'S3 Bucket': S3BucketIcon,
  'RDS': RDSIcon,
}

export const AZURE_ICON_MAP: Record<string, IconComponent> = {
  'Virtual Machine': AzVirtualMachine,
  'App Service': AzAppService,
  'SQL Database': AzSQLDatabase,
  'Storage': AzStorage,
  'Key Vault': AzKeyVault,
  'Virtual Network': AzVirtualNetwork,
  'Functions': AzFunctions,
  'Load Balancer': AzLoadBalancer,
  'Container Service': AzContainerService,
  'Event Hubs': AzEventHubs,
}
