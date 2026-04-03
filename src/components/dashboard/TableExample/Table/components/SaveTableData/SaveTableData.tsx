import { classNames } from '@/common'
import { Container } from './styles'
import { LoadingButton, LoadingButtonRefType } from '@/components'
import { useRef } from 'react'

type Props = {
  handleSave: () => Promise<void>
  isDirty: boolean
}

function SaveTableData({ handleSave, isDirty }: Props) {
  const loadingButtonRef = useRef<LoadingButtonRefType>(null)

  const handleClick = async () => {
    await handleSave()
    loadingButtonRef.current?.setIsLoading(false)
  }

  return (
    <Container
      className={classNames(
        'SaveTableData relative flex items-center justify-end gap-4',
        isDirty && 'active',
      )}
    >
      <p className="italic">Unsaved changes</p>
      <LoadingButton
        ref={loadingButtonRef}
        onClick={handleClick}
        className="save-table-data"
      >
        Save
      </LoadingButton>
    </Container>
  )
}

export default SaveTableData
